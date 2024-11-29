from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_percentage_error
import warnings
warnings.filterwarnings('ignore')
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import holidays
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ReorderRule(BaseModel):
    material_id: str
    min_stock: float
    reorder_point: float
    order_quantity: float
    vendor: str
    lead_time_days: int

class Order(BaseModel):
    id: int
    material_id: str
    quantity: float
    status: str
    created_at: datetime
    vendor: str
    expected_delivery: datetime

# Storage
reorder_rules: List[ReorderRule] = []
orders: List[Order] = []

def prepare_data() -> pd.DataFrame:
    try:
        df = pd.read_csv('1111003.csv')
        
        # Convert date columns to datetime
        date_columns = ['Posting Date', 'Document Date']
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Convert Order Qty to numeric, handling any non-numeric values
        df['Order Qty'] = pd.to_numeric(df['Order Qty'], errors='coerce')
        
        # Convert amount to numeric, removing currency symbols if present
        df['Amt.in Loc.Cur.'] = pd.to_numeric(df['Amt.in Loc.Cur.'].str.replace(r'[^\d.-]', '', regex=True), errors='coerce')
        
        # Sort by posting date
        df = df.sort_values('Posting Date')
        
        return df
    except Exception as e:
        print(f"Error preparing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error preparing data: {str(e)}")
class Alert(BaseModel):
    id: int
    type: str
    title: str
    description: str
    timestamp: datetime

@app.get("/api/inventory/check-alerts")
async def check_alerts():
    try:
        # Load and process data similar to your notification script
        store_sales = pd.read_csv("4999122.csv")
        
        # Data Preprocessing
        store_sales = store_sales.drop(columns=['MRP element','MRP elmnt data','Rescheduling date',
                                            'Exception','Plng Plant','Stor. Loc.','Rec P. Qty',
                                            'Day of the Week'], axis=1)
        
        store_sales['Planned dates'] = pd.to_datetime(store_sales['Planned dates'])
        store_sales['Rec./reqd qty'] = store_sales['Rec./reqd qty'].str.replace(',', '').astype(float)
        store_sales['Avail. Quantity'] = store_sales['Avail. Quantity'].str.replace(',', '').astype(float)
        
        # Calculate projections
        sample_date = datetime.now()
        end_date = sample_date + timedelta(days=14)
        filtered_data = store_sales[store_sales['Planned dates'] <= end_date]
        
        cumulative_available = filtered_data['Avail. Quantity'].sum()
        cumulative_required = filtered_data['Rec./reqd qty'].sum()
        
        # Adjust sign of cumulative_required
        if cumulative_required < 0:
            cumulative_required = abs(cumulative_required)
        else:
            cumulative_required = -abs(cumulative_required)
        
        alerts = []
        
        # Check for shortages
        if cumulative_required > cumulative_available:
            difference = cumulative_required - cumulative_available
            difference = difference/200  # Convert to kg as per your script
            
            alerts.append(Alert(
                id=1,
                type="critical",
                title="🚨 Butter Shortage Alert",
                description=f"Projected shortage of {difference:.2f} kg by {end_date.date()}",
                timestamp=datetime.now()
            ))
        
        return {"alerts": [alert.dict() for alert in alerts]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
def create_features(df):
    df = df.copy()
    
    # Group by posting date and calculate daily metrics
    daily_data = df.groupby('Posting Date').agg({
        'Order Qty': 'sum',
        'Total stock': 'last',
        'Amt.in Loc.Cur.': 'sum'
    }).reset_index()
    
    # Create time-based features
    daily_data['month'] = daily_data['Posting Date'].dt.month
    daily_data['quarter'] = daily_data['Posting Date'].dt.quarter
    daily_data['year'] = daily_data['Posting Date'].dt.year
    
    # Resample to biweekly frequency
    biweekly = daily_data.set_index('Posting Date').resample('2W').agg({
        'Order Qty': 'sum',
        'Total stock': 'last',
        'Amt.in Loc.Cur.': 'sum',
        'month': 'first',
        'quarter': 'first',
        'year': 'first'
    }).reset_index()
    
    # Calculate rolling statistics
    biweekly['rolling_mean'] = biweekly['Order Qty'].rolling(window=2, min_periods=1).mean()
    biweekly['rolling_std'] = biweekly['Order Qty'].rolling(window=2, min_periods=1).std()
    biweekly['pct_change'] = biweekly['Order Qty'].pct_change()
    
    # Fill missing values
    biweekly = biweekly.fillna(method='bfill').fillna(method='ffill')
    return biweekly

def train_model(df):
    feature_columns = ['month', 'quarter', 'rolling_mean', 'rolling_std', 'pct_change']
    for i in range(1, 4):
        df[f'lag_{i}'] = df['Order Qty'].shift(i)
    df = df.dropna()
    
    train_size = int(len(df) * 0.8)
    train_data = df[:train_size]
    test_data = df[train_size:]
    
    all_features = feature_columns + [col for col in df.columns if col.startswith('lag_')]
    X_train = train_data[all_features]
    y_train = train_data['Order Qty']
    
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    return model, all_features, test_data

def generate_forecast(df, model, features, periods=6):
    last_data = df.iloc[-len(features):].copy()
    forecast = model.predict(last_data[features].tail(1))
    return forecast[0]

@app.get("/api/inventory/summary")
async def get_inventory_summary():
    try:
        df = prepare_data()
        current_stock = df['Total stock'].iloc[-1]
        prev_stock = df['Total stock'].iloc[-2]
        stock_change = ((current_stock - prev_stock) / prev_stock * 100) if prev_stock != 0 else 0
        
        # Count active purchase orders
        active_orders = len(df[df['Purchase order'].notna()])
        
        # Count distinct vendors
        total_vendors = df['Vendor'].nunique()
        
        # Calculate average order value
        avg_order_value = df['Amt.in Loc.Cur.'].mean()
        
        return {
            "currentStock": float(current_stock),
            "stockChange": float(stock_change),
            "activeOrders": int(active_orders),
            "totalVendors": int(total_vendors),
            "averageOrderValue": float(avg_order_value)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/chart-data")
async def get_chart_data():
    try:
        df = prepare_data()
        # Filter for dates in 2024 only
        df['Posting Date'] = pd.to_datetime(df['Posting Date'])
        df = df[df['Posting Date'].dt.year >= 2024]
        
        chart_data = df.groupby('Posting Date').agg({
            'Total stock': 'last',
            'Order Qty': 'sum'
        }).reset_index()
        
        result = []
        for index, row in chart_data.iterrows():
            result.append({
                "date": row['Posting Date'].strftime('%Y-%m-%d'),  # This is now a datetime object, not a Series
                "stock": float(row['Total stock']),
                "required": float(row['Order Qty'])
            })
        return result
    except Exception as e:
        print(f"Error in get_chart_data: {str(e)}")  # Add this for debugging
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/analysis")
async def get_inventory_analysis():
    try:
        df = prepare_data()
        
        # Storage location analysis
        location_analysis = df.groupby('Storage location').agg({
            'Order Qty': ['count', 'sum', 'mean'],
            'Amt.in Loc.Cur.': ['sum', 'mean']
        }).round(2)
        
        # Movement type analysis
        movement_analysis = df.groupby(['Movement type', 'Movement Type Text']).size().to_dict()
        
        # Vendor analysis
        vendor_analysis = df.groupby('Vendor').agg({
            'Order Qty': 'sum',
            'Amt.in Loc.Cur.': 'sum'
        }).sort_values('Amt.in Loc.Cur.', ascending=False).head(5).to_dict()
        
        # Weekly patterns
        df['Week'] = df['Posting Date'].dt.isocalendar().week
        weekly_patterns = df.groupby('Week')['Order Qty'].sum().to_dict()
        
        return {
            "locationAnalysis": location_analysis.to_dict(),
            "movementAnalysis": {str(k): int(v) for k, v in movement_analysis.items()},
            "vendorAnalysis": vendor_analysis,
            "weeklyPatterns": {str(k): float(v) for k, v in weekly_patterns.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/forecast")
async def get_inventory_forecast():
    try:
        # Load and prepare data
        df = pd.read_csv('1111003.csv')
        df['Posting Date'] = pd.to_datetime(df['Posting Date'], errors='coerce')
        
        # Get US and Canadian holidays
        us_holidays = holidays.US(years=[2020, 2021, 2022, 2023, 2024])
        ca_holidays = holidays.CA(years=[2020, 2021, 2022, 2023, 2024])
        all_holidays = list(set(us_holidays.keys()).union(set(ca_holidays.keys())))
        
        # Holiday functions
        def nearest_holiday(posting_date):
            if pd.notna(posting_date):
                posting_date = posting_date.date()
                closest_holiday = min((holiday for holiday in all_holidays if abs((holiday - posting_date).days) <= 15),
                                  key=lambda x: abs(x - posting_date),
                                  default=None)
                if closest_holiday:
                    return closest_holiday
            return None
        
        def days_to_holiday(posting_date, nearest_holiday):
            if pd.notna(nearest_holiday) and pd.notna(posting_date):
                posting_date = posting_date.date()
                days_difference = (nearest_holiday - posting_date).days
                return days_difference if abs(days_difference) <= 21 else 0
            return 0
        
        # Process data
        df['Nearest Holiday'] = df['Posting Date'].apply(nearest_holiday)
        df['Days to Nearest Holiday'] = df.apply(lambda x: days_to_holiday(x['Posting Date'], x['Nearest Holiday']), axis=1)
        df.drop(columns='Nearest Holiday', inplace=True)
        
        # Drop unnecessary columns and prepare data
        df = df.drop(columns=['Material', 'Material description', 'Plant', 'Storage location', 'Base Unit of Measure', 
                            'Movement Type Text', 'User Name', 'Material Document', 'Document Date', 'Vendor', 
                            'Purchase order', 'Reason for Movement'], axis=1)
        
        df['Amt.in Loc.Cur.'] = df['Amt.in Loc.Cur.'].replace('[\$,]', '', regex=True).astype(float)
        
        # Encode Movement type
        enc = OneHotEncoder()
        movement_type_encoded = enc.fit_transform(df[['Movement type']]).toarray()
        movement_type_df = pd.DataFrame(movement_type_encoded, columns=enc.get_feature_names_out(['Movement type']))
        df = pd.concat([df.drop(['Movement type'], axis=1), movement_type_df], axis=1)
        
        # Split data and train model
        df['Year'] = df['Posting Date'].dt.year
        X = df.drop(['Order Qty', 'Posting Date', 'Year'], axis=1)
        y = df['Order Qty']
        
        X_train = X[df['Year'] < 2024]
        y_train = y[df['Year'] < 2024]
        X_test = X[df['Year'] == 2024]
        y_test = y[df['Year'] == 2024]
        test_dates = df[df['Year'] == 2024]['Posting Date']
        
        # Impute missing values
        imputer = SimpleImputer(strategy='mean')
        X_train = imputer.fit_transform(X_train)
        X_test = imputer.transform(X_test)
        
        # Train model and make predictions
        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        # Prepare response data
        forecast_data = []
        for date, actual, predicted in zip(test_dates, y_test, y_pred):
            forecast_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "actualSales": float(actual),
                "predictedSales": float(predicted)
            })
        
        # Calculate accuracy
        mse = mean_squared_error(y_test, y_pred)
        accuracy = 100 * (1 - min(1, mse / (y_test.var() if len(y_test) > 1 else 1)))
        
        return {
            "forecastAccuracy": float(accuracy),
            "forecastData": forecast_data
        }
        
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.post("/api/inventory/reorder-rules")
async def create_reorder_rule(rule: ReorderRule):
    try:
        reorder_rules.append(rule)
        return {"message": "Reorder rule created successfully", "rule": rule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/reorder-rules")
async def get_reorder_rules():
    return reorder_rules

@app.get("/api/inventory/orders")
async def get_orders():
    return orders

@app.post("/api/inventory/check-reorder")
async def check_and_create_orders():
    try:
        df = prepare_data()
        new_orders = []
        current_stock = df['Total stock'].iloc[-1]
        
        # Get forecast data to make smarter decisions
        biweekly_data = create_features(df)
        model, features, _ = train_model(biweekly_data)
        forecast = generate_forecast(biweekly_data, model, features)
        
        for rule in reorder_rules:
            # Check if current stock is below reorder point
            if current_stock <= rule.reorder_point:
                # Consider forecast in ordering decision
                adjusted_quantity = max(
                    rule.order_quantity,
                    int(forecast * 1.1)  # Add 10% buffer to forecasted demand
                )
                
                new_order = Order(
                    id=len(orders) + 1,
                    material_id=rule.material_id,
                    quantity=adjusted_quantity,
                    status="pending",
                    created_at=datetime.now(),
                    vendor=rule.vendor,
                    expected_delivery=datetime.now() + timedelta(days=rule.lead_time_days)
                )
                orders.append(new_order)
                new_orders.append(new_order)
        
        return {
            "message": f"Created {len(new_orders)} new orders",
            "orders": new_orders
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/inventory/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str):
    try:
        for order in orders:
            if order.id == order_id:
                order.status = status
                return {"message": "Order status updated", "order": order}
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)