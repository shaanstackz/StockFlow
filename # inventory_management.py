# inventory_management.py
import pandas as pd
import numpy as np

class InventoryManager:
    def __init__(self, config):
        self.config = config
        self.inventory_data = self._load_inventory_data()
    
    def _load_inventory_data(self):
        """
        Load inventory data from various sources
        Supports multiple data sources as specified in technical implementation
        """
        # Placeholder for data aggregation from POS, ERP systems
        return pd.DataFrame()
    
    def get_current_inventory(self):
        """
        Retrieve real-time inventory levels
        Simulate IoT sensor or software integration
        """
        current_stock = {
            'product_a': {
                'quantity': 500,
                'lead_time': 14,  # days
                'safety_stock': 100
            },
            'product_b': {
                'quantity': 250,
                'lead_time': 21,
                'safety_stock': 50
            }
        }
        return current_stock
    
    def calculate_reorder_points(self, current_inventory, demand_forecast):
        """
        Dynamically calculate reorder points
        Considers demand variability and lead times
        """
        reorder_recommendations = {}
        
        for product, details in current_inventory.items():
            # Forecast demand for lead time period
            forecasted_demand = demand_forecast.get(product, 0)
            
            # Calculate dynamic reorder point
            reorder_point = (
                forecasted_demand * details['lead_time'] + 
                details['safety_stock']
            )
            
            should_reorder = details['quantity'] <= reorder_point
            
            reorder_quantity = (
                max(reorder_point - details['quantity'], 0)
                if should_reorder else 0
            )
            
            reorder_recommendations[product] = {
                'current_stock': details['quantity'],
                'reorder_point': reorder_point,
                'should_reorder': should_reorder,
                'quantity': reorder_quantity
            }
        
        return reorder_recommendations
