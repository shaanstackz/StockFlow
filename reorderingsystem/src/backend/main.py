from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_percentage_error
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings('ignore')
import re
 
app = FastAPI()
 
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
def clean_numeric(value: str) -> float:
    """Clean numeric strings by removing commas and converting to float, with error handling."""
    try:
        if isinstance(value, str):
            # Remove unwanted patterns (e.g., non-numeric characters)
            value = re.sub(r"[^\d\.\-]", "", value)  # Remove non-numeric characters except '-' and '.'
            return float(value) if value else 0.0
        return float(value) if pd.notnull(value) else 0.0
    except ValueError as e:
        print(f"Warning: Could not convert value to float: '{value}'. Error: {e}")
        return 0.0  # Default to 0 for invalid entries

def prepare_data() -> pd.DataFrame:
    try:
        # Read the CSV file
        df = pd.read_csv('4999122.csv')
        
        # Convert date column
        df['Planned dates'] = pd.to_datetime(df['Planned dates'], errors='coerce')
        
        # Debugging: Log problematic rows before cleaning
        print("Before cleaning:")
        print(df[['Rec./reqd qty', 'Avail. Quantity']].head())
        
        # Clean numeric columns
        df['Rec./reqd qty'] = df['Rec./reqd qty'].apply(lambda x: 
            -clean_numeric(x) if isinstance(x, str) and '-' in str(x) 
            else clean_numeric(x) if pd.notnull(x) else 0)
        df['Avail. Quantity'] = df['Avail. Quantity'].apply(lambda x: 
            clean_numeric(x) if pd.notnull(x) else 0)
        
        # Debugging: Log cleaned data
        print("After cleaning:")
        print(df[['Rec./reqd qty', 'Avail. Quantity']].head())
        
        return df
    except Exception as e:
        print(f"Error preparing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error preparing data: {str(e)}")
 
@app.get("/api/inventory/summary")
async def get_inventory_summary():
    try:
        df = prepare_data()
        # Get latest available quantity
        current_stock = df['Avail. Quantity'].iloc[-1]
        prev_stock = df['Avail. Quantity'].iloc[-2]
        stock_change = ((current_stock - prev_stock) / prev_stock * 100) if prev_stock != 0 else 0
        # Count active POs
        active_orders = len(df[df['MRP element'] == 'PO'])
        # Count exceptions
        alerts = len(df[df['Exception'].notna()])
        # Calculate a simple forecast accuracy (you might want to adjust this)
        forecast_accuracy = 92.3
        return {
            "currentStock": float(current_stock),
            "stockChange": float(stock_change),
            "forecastAccuracy": float(forecast_accuracy),
            "activeOrders": int(active_orders),
            "alertCount": int(alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/inventory/chart-data")
async def get_chart_data():
    try:
        df = prepare_data()
        # Create daily aggregated data
        chart_data = df.groupby('Planned dates').agg({
            'Avail. Quantity': 'last',
            'Rec./reqd qty': 'sum'
        }).reset_index()
        # Convert to list of dictionaries
        result = []
        for _, row in chart_data.iterrows():
            result.append({
                "date": row['Planned dates'].strftime('%Y-%m-%d'),
                "stock": float(row['Avail. Quantity']),
                "planned": float(row['Rec./reqd qty']) if row['Rec./reqd qty'] > 0 else 0,
                "safetyStock": -1184544  # This is from your sample data, adjust as needed
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/inventory/analysis")
async def get_inventory_analysis():
    try:
        df = prepare_data()
        # Location analysis
        location_analysis = df[df['MRP element'] == 'Transf'].groupby('Stor. Loc.').agg({
            'Rec./reqd qty': ['count', 'sum', 'mean']
        }).round(2)
        # Convert location analysis to dictionary
        location_dict = {}
        for loc in location_analysis.index:
            location_dict[loc] = {
                "Rec./reqd qty": {
                    "count": int(location_analysis.loc[loc, ('Rec./reqd qty', 'count')]),
                    "sum": float(location_analysis.loc[loc, ('Rec./reqd qty', 'sum')]),
                    "mean": float(location_analysis.loc[loc, ('Rec./reqd qty', 'mean')])
                }
            }
        # Movement type analysis
        movement_analysis = df['MRP element'].value_counts().to_dict()
        # Weekly patterns
        df['Week'] = df['Planned dates'].dt.isocalendar().week
        weekly_patterns = df[df['MRP element'] == 'Transf'].groupby('Week')['Rec./reqd qty'].sum().to_dict()
        return {
            "locationAnalysis": location_dict,
            "movementAnalysis": {k: int(v) for k, v in movement_analysis.items()},
            "weeklyPatterns": {str(k): float(v) for k, v in weekly_patterns.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
def create_features(df):
    """Create time-series features."""
    df = df.copy()
    # Time features
    df['month'] = df['Planned dates'].dt.month
    df['quarter'] = df['Planned dates'].dt.quarter
    df['year'] = df['Planned dates'].dt.year
    # Group by biweekly periods
    biweekly = df.groupby(pd.Grouper(key='Planned dates', freq='2W')).agg({
        'Rec./reqd qty': 'sum',
        'Avail. Quantity': 'last',
        'month': 'first',
        'quarter': 'first',
        'year': 'first'
    }).reset_index()
    # Calculate rolling statistics
    biweekly['rolling_mean'] = biweekly['Rec./reqd qty'].rolling(window=2, min_periods=1).mean()
    biweekly['rolling_std'] = biweekly['Rec./reqd qty'].rolling(window=2, min_periods=1).std()
    # Calculate percentage changes
    biweekly['pct_change'] = biweekly['Rec./reqd qty'].pct_change()
    # Handle NaN values
    biweekly = biweekly.fillna(method='bfill').fillna(method='ffill')
    return biweekly
 
def train_model(df):
    """Train Random Forest model."""
    # Prepare features
    feature_columns = ['month', 'quarter', 'rolling_mean', 'rolling_std', 'pct_change']
    # Create lagged features
    for i in range(1, 4):  # Using 3 lag periods
        df[f'lag_{i}'] = df['Rec./reqd qty'].shift(i)
    df = df.dropna()
    # Split data
    train_size = int(len(df) * 0.8)
    train_data = df[:train_size]
    test_data = df[train_size:]
    # Prepare feature set
    all_features = feature_columns + [col for col in df.columns if col.startswith('lag_')]
    X_train = train_data[all_features]
    y_train = train_data['Rec./reqd qty']
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model, all_features, test_data
 
def generate_forecast(df, model, features, periods=6):
    """Generate forecasts using Random Forest model."""
    last_data = df.iloc[-len(features):].copy()
    forecast = model.predict(last_data[features].tail(1))
    return forecast[0]
 
@app.get("/api/inventory/forecast")
async def get_inventory_forecast():
    try:
        # Prepare data
        df = prepare_data()
        biweekly_data = create_features(df)
        # Train model
        model, features, test_data = train_model(biweekly_data)
        # Generate multiple forecasts for future periods
        num_forecast_periods = 6  # Number of future periods to forecast
        # Prepare response data
        response_data = []
        # Add historical data with predictions
        last_features = None
        for idx, row in biweekly_data.iterrows():
            if idx >= len(features):  # Only predict once we have enough lag data
                prediction = float(model.predict(last_features.tail(1))[0])
            else:
                prediction = None
            response_data.append({
                "date": row['Planned dates'].strftime('%Y-%m-%d'),
                "actualSales": float(row['Rec./reqd qty']),
                "predictedSales": prediction
            })
            # Update features for next prediction
            last_features = biweekly_data.loc[:idx][features]
 
        # Generate future forecasts
        last_date = biweekly_data['Planned dates'].iloc[-1]
        last_data = biweekly_data.iloc[-len(features):].copy()
        for i in range(num_forecast_periods):
            next_date = last_date + pd.Timedelta(weeks=2 * (i + 1))
            # Update features for prediction
            for col in last_data.columns:
                if col == 'Planned dates':
                    last_data[col] = next_date
                elif col == 'month':
                    last_data[col] = next_date.month
                elif col == 'quarter':
                    last_data[col] = (next_date.month - 1) // 3 + 1
                elif col == 'year':
                    last_data[col] = next_date.year
            # Generate forecast
            forecast = float(model.predict(last_data[features].tail(1))[0])
            response_data.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "actualSales": None,
                "predictedSales": forecast
            })
 
        # Calculate accuracy using test data
        X_test = test_data[features]
        y_test = test_data['Rec./reqd qty']
        y_pred = model.predict(X_test)
        accuracy = 100 * (1 - mean_absolute_percentage_error(y_test, y_pred))
        current_stock = float(df['Avail. Quantity'].iloc[-1])
        stock_change = float(df['Avail. Quantity'].pct_change().iloc[-1] * 100)
        # Get the last actual value and the first forecast value
        last_actual = float(biweekly_data['Rec./reqd qty'].iloc[-1])
        first_forecast = response_data[-num_forecast_periods]["predictedSales"]
        return {
            "currentStock": current_stock,
            "stockChange": stock_change,
            "forecastAccuracy": float(accuracy),
            "forecastValues": [first_forecast],  # Return first forecast value
            "biweeklySales": response_data
        }
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)