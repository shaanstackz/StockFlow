from flask import Flask, render_template, request, jsonify
from inventory_management import InventoryManager

app = Flask(__name__)
config = {
    'data_source': 'erp_system',
    'safety_stock_multiplier': 1.5
}

# Instantiate the InventoryManager with the config
inventory = InventoryManager(config)

@app.route('/')
def home():
    """Serve the HTML file."""
    return render_template('home.html')

@app.route('/get_inventory', methods=['GET'])
def get_inventory():
    """Get all inventory items."""
    items = []
    with inventory.db_path as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products")
        items = cursor.fetchall()
    return jsonify(items)

@app.route('/add_product', methods=['POST'])
def add_product():
    """Add a new product to the inventory."""
    data = request.json
    try:
        inventory.add_product(
            data['name'], 
            data['current_stock'], 
            data['min_stock'], 
            data['reorder_point'], 
            data['supplier']
        )
        return jsonify({'message': 'Product added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/check_reorder', methods=['GET'])
def check_reorder():
    """Check for products that need reordering."""
    reorder_needs = inventory.check_reorder_needs()
    return jsonify(reorder_needs)

@app.route('/simulate_reorder', methods=['POST'])
def simulate_reorder():
    """Simulate a reorder for a product."""
    data = request.json
    try:
        inventory.place_reorder(data['product_id'], data.get('quantity', 20))
        return jsonify({'message': 'Reorder simulated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
