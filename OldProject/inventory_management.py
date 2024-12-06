import pandas as pd
import numpy as np

class InventoryManager:
    def __init__(self, config):
        """
        Initializes the InventoryManager class.
        
        :param config: Configuration dictionary or object that contains necessary settings.
        """
        self.config = config
        self.inventory_data = self._load_inventory_data()  # Loads initial inventory data

    def _load_inventory_data(self):
        """
        Load inventory data from various sources.
        
        This method is a placeholder for integrating multiple data sources (POS, ERP, etc.)
        Returns a DataFrame with inventory information.
        """
        # For demonstration, we're returning an empty DataFrame. You should replace this with actual data aggregation logic.
        return pd.DataFrame()

    def get_current_inventory(self):
        """
        Retrieve real-time inventory levels.
        
        This is a simulation of an IoT sensor or software integration that retrieves stock quantities.
        Returns a dictionary with product quantities and related data (e.g., lead time, safety stock).
        """
        current_stock = {
            'product_a': {
                'quantity': 500,
                'lead_time': 14,  # Lead time in days
                'safety_stock': 100
            },
            'product_b': {
                'quantity': 250,
                'lead_time': 21,  # Lead time in days
                'safety_stock': 50
            }
        }
        return current_stock
    
    def calculate_reorder_points(self, current_inventory, demand_forecast):
        """
        Dynamically calculate reorder points for each product.
        
        Takes into account demand variability and lead times.
        
        :param current_inventory: A dictionary with current stock details (e.g., quantity, lead time, safety stock)
        :param demand_forecast: A dictionary with forecasted demand for each product over a specific period (e.g., month)
        
        :return: A dictionary with recommended reorder points and quantities for each product
        """
        reorder_recommendations = {}
        
        for product, details in current_inventory.items():
            # Forecast demand for the given product
            forecasted_demand = demand_forecast.get(product, 0)
            
            # Calculate dynamic reorder point based on forecasted demand and safety stock
            reorder_point = (
                forecasted_demand * details['lead_time'] + details['safety_stock']
            )
            
            # Determine if a reorder is necessary (i.e., current stock is less than or equal to the reorder point)
            should_reorder = details['quantity'] <= reorder_point
            
            # Calculate the quantity to reorder, only if needed
            reorder_quantity = (
                max(reorder_point - details['quantity'], 0)
                if should_reorder else 0
            )
            
            # Store reorder recommendation
            reorder_recommendations[product] = {
                'current_stock': details['quantity'],
                'reorder_point': reorder_point,
                'should_reorder': should_reorder,
                'quantity': reorder_quantity
            }
        
        return reorder_recommendations


# Example Usage
if __name__ == "__main__":
    # Example config (could be a file path or other settings)
    config = {
        'data_source': 'erp_system',
        'safety_stock_multiplier': 1.5
    }
    
    # Instantiate the InventoryManager with configuration
    inventory_manager = InventoryManager(config)
    
    # Get current inventory levels
    current_inventory = inventory_manager.get_current_inventory()
    
    # Example demand forecast (could be dynamically fetched from other systems)
    demand_forecast = {
        'product_a': 30,  # Forecasted demand for product_a (e.g., 30 units/month)
        'product_b': 20   # Forecasted demand for product_b
    }
    
    # Calculate reorder points
    reorder_recommendations = inventory_manager.calculate_reorder_points(current_inventory, demand_forecast)
    
    # Print reorder recommendations
    for product, recommendation in reorder_recommendations.items():
        print(f"Product: {product}")
        print(f"  Current Stock: {recommendation['current_stock']}")
        print(f"  Reorder Point: {recommendation['reorder_point']}")
        print(f"  Should Reorder: {recommendation['should_reorder']}")
        print(f"  Quantity to Reorder: {recommendation['quantity']}")
