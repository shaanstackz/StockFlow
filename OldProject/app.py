from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
import os

# Anthropic API setup
# Option 1: Set API key as environment variable
os.environ['ANTHROPIC_API_KEY'] = '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'

# Option 2: Pass API key directly when creating client (less secure)
anthropic = Anthropic(api_key='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')

# Flask app setup
app = Flask(__name__)

# Example configuration for inventory management
inventory = [
    {"id": 1, "name": "Widget A", "current_stock": 50, "min_stock": 10, "reorder_point": 20, "supplier": "Supplier X"},
    {"id": 2, "name": "Widget B", "current_stock": 30, "min_stock": 5, "reorder_point": 10, "supplier": "Supplier Y"}
]

@app.route('/')
def home():
    """Serve the HTML file."""
    return render_template('home.html')

@app.route('/get_inventory', methods=['GET'])
def get_inventory():
    try:
        return jsonify({"products": inventory}), 200
    except Exception as e:
        print(f"Error fetching inventory: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        product = request.json
        if not all(k in product for k in ('name', 'current_stock', 'min_stock', 'reorder_point', 'supplier')):
            return jsonify({"error": "Invalid product data"}), 400
        
        new_product = {
            "id": len(inventory) + 1,
            **product
        }
        inventory.append(new_product)
        return jsonify({"message": "Product added successfully"}), 201
    except Exception as e:
        print(f"Error adding product: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/ask_claude', methods=['POST'])
def ask_claude():
    """
    Endpoint to interact with Claude using the Anthropic API.
    """
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({"error": "Message content is required"}), 400

    try:
        # Make a request to Claude via Anthropic API
        response = anthropic.completions.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )
        return jsonify({"response": response['completion']}), 200
    except Exception as e:
        print(f"Error interacting with Claude: {e}")
        return jsonify({"error": "Failed to process the request"}), 500

if __name__ == '__main__':
    app.run(debug=True)
