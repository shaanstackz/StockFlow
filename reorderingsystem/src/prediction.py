# Import required libraries
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, Lasso, Ridge
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime
import holidays
import os
from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
 
# Load and prepare data
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
 
# Group data by biweekly periods
biweekly_sales = store_sales.groupby(pd.Grouper(key='Planned dates', freq='2W')).sum().reset_index()
print(biweekly_sales.head())
print(biweekly_sales['Planned dates'].dtype)
 
# Calculate the difference in sales for stationarity
biweekly_sales['req_diff'] = biweekly_sales['Rec./reqd qty'].diff()
biweekly_sales = biweekly_sales.dropna()
 
# Prepare supervised data
supervised_data = biweekly_sales.drop(['Planned dates', 'Rec./reqd qty'], axis=1)
 
# Create lag features
for i in range(1,13):
    col_name = 'biweek_' + str(i)
    supervised_data[col_name] = supervised_data['req_diff'].shift(i)
supervised_data = supervised_data.dropna()
 
# Split data into train and test sets
train_data = supervised_data[:-12]
test_data = supervised_data[-12:]
print("Train Data Shape: ", train_data.shape)
print("Test Data Shape: ", test_data.shape)
 
# Scale the data
scaler = MinMaxScaler(feature_range=(-1,1))
scaler.fit(train_data)
train_data = scaler.transform(train_data)
test_data = scaler.transform(test_data)
 
# Prepare X and y for modeling
X_train, y_train = train_data[:,1:], train_data[:,0:1]
X_test, y_test = test_data[:,1:], test_data[:,0:1]
y_train = y_train.ravel()
y_test = y_test.ravel()
 
# Prepare dates for prediction
sales_dates = biweekly_sales['Planned dates'][-12:].reset_index(drop=True)
predict_df = pd.DataFrame(sales_dates)
 
# Get actual sales values
act_sales = biweekly_sales['Rec./reqd qty'][-13:].to_list()
 
# Train Linear Regression model
lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
lr_pre = lr_model.predict(X_test)
 
# Process predictions
lr_pre = lr_pre.reshape(-1,1)
lr_pre_test_set = np.concatenate([lr_pre, X_test], axis=1)
lr_pre_test_set = scaler.inverse_transform(lr_pre_test_set)
 
# Create results list and merge with predictions
result_list = []
for index in range(0, len(lr_pre_test_set)):
    result_list.append(lr_pre_test_set[index][0] + act_sales[index])
lr_pre_series = pd.Series(result_list, name="Linear Prediction")
predict_df = predict_df.merge(lr_pre_series, left_index=True, right_index=True)
 
# Calculate metrics
lr_mse = np.sqrt(mean_squared_error(predict_df['Linear Prediction'], 
                                  biweekly_sales['Rec./reqd qty'][-12:]))
lr_mae = mean_absolute_error(predict_df['Linear Prediction'], 
                           biweekly_sales['Rec./reqd qty'][-12:])
lr_r2 = r2_score(predict_df['Linear Prediction'], 
                 biweekly_sales['Rec./reqd qty'][-12:])
 
# Print metrics
print("Linear Regression MSE: ", lr_mse)
print("Linear Regression MAE: ", lr_mae)
print("Linear Regression R2: ", lr_r2)
 
# Plot results
plt.figure(figsize=(15,5))
plt.plot(biweekly_sales['Planned dates'], biweekly_sales['Rec./reqd qty'])
plt.plot(predict_df['Planned dates'], predict_df['Linear Prediction'])
plt.title("Customer sales Forecast using LR Model")
plt.xlabel("Date")
plt.ylabel("Sales")
plt.legend(['Actual Sales', 'Predicted sales'])
plt.show()