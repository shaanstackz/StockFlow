from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

class DemandPredictor:
    def __init__(self, config):
        self.config = config
        self.model = RandomForestRegressor(n_estimators=100)
        self.scaler = StandardScaler()
        self.is_trained = False  # Add a flag to track model state
    def prepare_training_data(self, historical_data):
        """
        Prepare data for machine learning model
        - Incorporate seasonality
        - Include external factors
        """
        features = pd.DataFrame({
            'month': historical_data.index.month,
            'day_of_week': historical_data.index.dayofweek,
            'is_holiday': self._get_holiday_indicator(historical_data.index),
            # Add more contextual features
        })
        
        features['sales'] = historical_data['sales']
        return features
    def _get_holiday_indicator(self, dates):
        # Placeholder for holiday detection logic
        return [0] * len(dates)
    def train_model(self, historical_sales_data):
        """Train ML model on historical sales data"""
        prepared_data = self.prepare_training_data(historical_sales_data)
        X = prepared_data.drop('sales', axis=1)
        y = prepared_data['sales']
        
        if X.empty or y.empty:
            raise ValueError("Training data is empty or invalid.")

        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True  # Mark model as trained

    def predict_demand(self, forecast_period=30):
        if not self.is_trained:
            raise RuntimeError("Model must be trained before predictions can be made.")

        # Generate future dates
        future_dates = pd.date_range(start=pd.Timestamp.now(), periods=forecast_period)
        
        future_features = pd.DataFrame({
            'month': future_dates.month,
            'day_of_week': future_dates.dayofweek,
            'is_holiday': self._get_holiday_indicator(future_dates)
        })
        
        future_features_scaled = self.scaler.transform(future_features)
        predicted_demand = self.model.predict(future_features_scaled)

        return pd.Series(predicted_demand, index=future_dates)
