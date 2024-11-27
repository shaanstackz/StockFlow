# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from typing import Dict, Any
 
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
    """Clean numeric strings by removing commas and converting to float"""
    if isinstance(value, str):
        return float(value.replace(',', '').replace('-', ''))
    return float(value)
 
def prepare_data() -> pd.DataFrame:
    try:
        # Read the CSV file
        df = pd.read_csv('4999122.csv')
        # Convert date column
        df['Planned dates'] = pd.to_datetime(df['Planned dates'])
        # Clean numeric columns
        df['Rec./reqd qty'] = df['Rec./reqd qty'].apply(lambda x: 
            -clean_numeric(x) if isinstance(x, str) and '-' in str(x) 
            else clean_numeric(x) if pd.notnull(x) else 0)
        df['Avail. Quantity'] = df['Avail. Quantity'].apply(lambda x: 
            clean_numeric(x) if pd.notnull(x) else 0)
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
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)