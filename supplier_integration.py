# supplier_integration.py
import requests
import logging

class SupplierIntegration:
    def __init__(self, config):
        self.config = config
        self.suppliers = {
            'supplier_a': {
                'api_endpoint': 'https://supplier-a.com/orders',
                'api_key': 'secret_key_1'
            },
            'supplier_b': {
                'api_endpoint': 'https://supplier-b.com/purchase',
                'api_key': 'secret_key_2'
            }
        }
        self.logger = logging.getLogger(__name__)
    
    def create_purchase_order(self, product, quantity):
        """
        Automate purchase order generation
        Route to appropriate supplier based on product
        """
        # Select supplier based on product mapping
        supplier = self._select_supplier(product)
        
        try:
            response = requests.post(
                supplier['api_endpoint'],
                headers={
                    'Authorization': f'Bearer {supplier["api_key"]}',
                    'Content-Type': 'application/json'
                },
                json={
                    'product': product,
                    'quantity': quantity,
                    'order_type': 'automated_reorder'
                }
            )
            
            response.raise_for_status()
            order_details = response.json()
            
            self.logger.info(f"Purchase order created: {order_details['order_id']}")
            return order_details
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Supplier order failed: {e}")
            raise
    
    def _select_supplier(self, product):
        """
        Logic to select optimal supplier
        Can incorporate supplier performance metrics
        """
        # Simplified supplier selection
        return self.suppliers.get('supplier_a', {})
