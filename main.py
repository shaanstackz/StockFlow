# main.py
import logging
from inventory_management import InventoryManager
from demand_forecasting import DemandPredictor
from supplier_integration import SupplierIntegration
from notification_system import NotificationService

class AutomatedReorderingSystem:
    def __init__(self, config):
        self.inventory_manager = InventoryManager(config)
        self.demand_predictor = DemandPredictor(config)
        self.supplier_integration = SupplierIntegration(config)
        self.notification_service = NotificationService(config)
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def run_reordering_cycle(self):
        try:
            # 1. Forecast Demand
            demand_forecast = self.demand_predictor.predict_demand()
            
            # 2. Check Current Inventory
            current_inventory = self.inventory_manager.get_current_inventory()
            
            # 3. Calculate Reorder Needs
            reorder_recommendations = self.inventory_manager.calculate_reorder_points(
                current_inventory, 
                demand_forecast
            )
            
            # 4. Generate Purchase Orders
            for product, order_details in reorder_recommendations.items():
                if order_details['should_reorder']:
                    purchase_order = self.supplier_integration.create_purchase_order(
                        product, 
                        order_details['quantity']
                    )
                    
                    # 5. Send Notifications
                    self.notification_service.send_reorder_notification(
                        product, 
                        order_details['quantity']
                    )
                    
                    self.logger.info(f"Reorder for {product}: {order_details['quantity']} units")
        
        except Exception as e:
            self.logger.error(f"Reordering cycle failed: {e}")
            self.notification_service.send_error_notification(str(e))

def main():
    # Configuration can be loaded from a config file or environment
    config = {
        'data_sources': ['pos_system', 'erp_software'],
        'reorder_thresholds': {
            'min_stock_days': 14,
            'max_stock_days': 45
        }
    }
    
    reordering_system = AutomatedReorderingSystem(config)
    reordering_system.run_reordering_cycle()

if __name__ == "__main__":
    main()
