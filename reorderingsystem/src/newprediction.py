import pandas as pd
import holidays
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
 
# Load the data
file_path = r'1111003.csv'
butter_data = pd.read_csv(file_path)
butter_data['Posting Date'] = pd.to_datetime(butter_data['Posting Date'], errors='coerce')
 
# Merge US and Canadian holidays into a single list within the date range of the dataset
us_holidays = holidays.US(years=[2020, 2021, 2022, 2023, 2024])
ca_holidays = holidays.CA(years=[2020, 2021, 2022, 2023, 2024])
all_holidays = list(set(us_holidays.keys()).union(set(ca_holidays.keys())))
 
# Find the closest holiday within 15 days
def nearest_holiday(posting_date):
    if pd.notna(posting_date):
        posting_date = posting_date.date()  # Convert to datetime.date if it's a Timestamp
        closest_holiday = min((holiday for holiday in all_holidays if abs((holiday - posting_date).days) <= 15),
                              key=lambda x: abs(x - posting_date),
                              default=None)
        if closest_holiday:
            return closest_holiday
    return None
 
butter_data['Nearest Holiday'] = butter_data['Posting Date'].apply(nearest_holiday)
 
# Calculate days to the nearest holiday and apply the conditions
def days_to_holiday(posting_date, nearest_holiday):
    if pd.notna(nearest_holiday) and pd.notna(posting_date):
        posting_date = posting_date.date()  # Convert to datetime.date if it's a Timestamp
        days_difference = (nearest_holiday - posting_date).days
        return days_difference if abs(days_difference) <= 21 else 0
    return 0
 
butter_data['Days to Nearest Holiday'] = butter_data.apply(lambda x: days_to_holiday(x['Posting Date'], x['Nearest Holiday']), axis=1)
butter_data.drop(columns='Nearest Holiday', inplace=True)  # Remove as it's no longer needed
 
# Convert 'Movement type' to categorical
butter_data['Movement type'] = butter_data['Movement type'].astype('category')
 
print(butter_data)
butter_data = butter_data.drop(columns=['Material','Material description','Plant','Storage location','Base Unit of Measure','Movement Type Text','User Name','Material Document','Document Date','Vendor','Purchase order','Reason for Movement'],axis=1) #Dropping store and items columns
butter_data['Posting Date'] = pd.to_datetime(butter_data['Posting Date'], errors='coerce')
butter_data['Amt.in Loc.Cur.'] = butter_data['Amt.in Loc.Cur.'].replace('[\$,]', '', regex=True).astype(float)
 
# Assuming 'Movement type' is categorical and needs to be encoded
enc = OneHotEncoder()
movement_type_encoded = enc.fit_transform(butter_data[['Movement type']]).toarray()
movement_type_df = pd.DataFrame(movement_type_encoded, columns=enc.get_feature_names_out(['Movement type']))
butter_data = pd.concat([butter_data.drop(['Movement type'], axis=1), movement_type_df], axis=1)
 
# Extract year for splitting data
butter_data['Year'] = butter_data['Posting Date'].dt.year
 
# Split data into features and target
X = butter_data.drop(['Order Qty', 'Posting Date', 'Year'], axis=1)
y = butter_data['Order Qty']
posting_dates = butter_data[['Posting Date', 'Year']]
# Train-test split based on the year
X_train = X[butter_data['Year'] < 2024]
y_train = y[butter_data['Year'] < 2024]
X_test = X[butter_data['Year'] == 2024]
y_test = y[butter_data['Year'] == 2024]
test_dates = posting_dates[butter_data['Year'] == 2024]['Posting Date']
 
# Impute missing values in X_train and X_test
imputer = SimpleImputer(strategy='mean')
X_train = imputer.fit_transform(X_train)
X_test = imputer.transform(X_test)
 
# Train a linear regression model
model = LinearRegression()
model.fit(X_train, y_train)
 
# Predict on test data
y_pred = model.predict(X_test)
 
# Compare predictions with actual values
#comparison = pd.DataFrame({'Actual': y_test, 'Predicted': y_pred}, index=y_test.index)
comparison = pd.DataFrame({'Posting Date': test_dates, 'Actual': y_test, 'Predicted': y_pred})
 
# Plotting the results
plt.figure(figsize=(10, 6))
plt.scatter(comparison['Posting Date'], comparison['Actual'], color='blue', label='Actual', alpha=0.6)
plt.scatter(comparison['Posting Date'], comparison['Predicted'], color='red', label='Predicted', alpha=0.6)
plt.title('Actual vs Predicted Order Quantities for 2024')
plt.xlabel('Date')
plt.ylabel('Order Quantity')
plt.legend()
plt.grid(True)
plt.show()
 
# Calculate and print the Mean Squared Error
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse}")