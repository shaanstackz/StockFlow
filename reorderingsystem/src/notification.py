import requests
import json
import pandas as pd
 
# Load data
store_sales = pd.read_csv("4999122.csv")
 
# Check data info
store_sales.info()
 
# Check for missing values
print(store_sales.isnull().sum())
 
# Data Preprocessing
# Drop unnecessary columns
store_sales = store_sales.drop(columns=['MRP element','MRP elmnt data','Rescheduling date',
                                        'Exception','Plng Plant','Stor. Loc.','Rec P. Qty',
                                        'Day of the Week'],axis=1)
 
# Convert date and numeric columns
store_sales['Planned dates'] = pd.to_datetime(store_sales['Planned dates'])
store_sales['Rec./reqd qty'] = store_sales['Rec./reqd qty'].str.replace(',', '').astype(float)
store_sales['Avail. Quantity'] = store_sales['Avail. Quantity'].str.replace(',', '').astype(float)
 
# Calculate cumulative sums for 'Avail. Quantity' and 'Rec./reqd qty'
store_sales['Cumulative Available'] = store_sales['Avail. Quantity'].cumsum()
store_sales['Cumulative Required'] = store_sales['Rec./reqd qty'].cumsum()
 
# Print the data to verify the new columns
print(store_sales[['Planned dates', 'Cumulative Available', 'Cumulative Required']])
 
# Sample date for checking
sample_date = pd.to_datetime('2024-11-15')  # Replace with any date you want to check
 
 
 
def send_teams_notification(recipients, message):
    # Retrieve Teams link (you can replace this with your own link retrieval logic)
    teams_link = ""  # Replace with your Teams link URL
 
    # Prepare the payload data
    payload = {
        "Recipients": recipients,
        "Message": message
    }
 
    # Serialize payload to JSON
    json_payload = json.dumps(payload)
 
    # Set the headers for the request
    headers = {
        "Content-Type": "application/json"
    }
 
    # Send POST request to Power Automate flow endpoint
    response = requests.post(teams_link, data=json_payload, headers=headers)
 
    # Check the response status
    if response.status_code == 200:
        print("Notification sent successfully!")
    else:
        
        #print(f"Failed to send notification. Status code: {response.status_code}")
        print(response.text)
 
# Example usage
recipients = "example@example.com"  # Replace with actual recipients
 
end_date = sample_date + pd.Timedelta(days=14)
filtered_data = store_sales[store_sales['Planned dates'] <= end_date]
 
# Sum up the cumulative Available and Required quantities up to the end_date
cumulative_available = filtered_data['Avail. Quantity'].sum()
cumulative_required = filtered_data['Rec./reqd qty'].sum()
 
# Adjust the sign of cumulative_required based on its value
if cumulative_required < 0:
    cumulative_required = abs(cumulative_required)  # Make it positive if negative
else:
    cumulative_required = -abs(cumulative_required)  # Make it negative if positive
 
 
    # Check if the required quantity exceeds the available quantity
if cumulative_required > cumulative_available:
    difference = cumulative_required - cumulative_available
    difference=difference/200
    message = (
    f"🚨 Butter Breakdown Alert! 🚨\n"
    f"We’re about {difference:.2f} kg short of buttery bliss! 😱\n\n"
    f"In just two weeks ({end_date.date()}), we’ll be stuck spreading *regret* on our toast instead of butter 🧈. "
    "The ovens are roaring (metaphorically—don’t call the fire department 🔥), but our butter stash is toast! 😬\n\n"
    "No butter means we’ll be whipping up… *sandpaper croissants* 🥐, *cardboard cookies* 🍪, and *scones so dry "
    "they double as hockey pucks*. 🏒 Not a good look for us.\n\n"
    "Our production line might screech to a halt like someone stepping on a stick of butter barefoot. 🏭💥 "
    "And the only thing worse than a butter-less bakery is… well, *nothing*. 😅\n\n"
    "This message is brought to you by the urgent need for butter—because without it, we can’t churn out the magic. 🧙‍♂️✨\n"
    "Help us out before we become a butter-less bakery! 🧈😂"
    )
 
    send_teams_notification(recipients, message)
else:
    print(f"On {sample_date.date()}, available quantity is sufficient.")
 
   
print(cumulative_available,cumulative_required)
