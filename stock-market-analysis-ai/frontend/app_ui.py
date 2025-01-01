import streamlit as st
import requests
import os

# Backend URL Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'https://stock-analysis-agent.onrender.com')

# Title of the App
st.title("📊 Indian Stock Market Analysis Tool")

# User Input for Stock Symbol
symbol = st.text_input("Enter Stock Symbol (e.g., RELIANCE):")

# Analyze Button
if st.button("Analyze"):
    if symbol:
        try:
            # Use the backend URL dynamically
            response = requests.get(f"{BACKEND_URL}/analyze/{symbol}")
            
            if response.status_code == 200:
                data = response.json()

                # Display Stock Data
                st.subheader("📈 Stock Data")
                if 'error' in data.get('stock_data', {}):
                    st.error(data['stock_data']['error'])
                else:
                    for key, value in data['stock_data'].items():
                        st.write(f"**{key.replace('_', ' ').capitalize()}:** {value}")

                # Display Technical Indicators
                st.subheader("📊 Technical Indicators")
                if 'error' in data.get('technical_data', {}):
                    st.error(data['technical_data']['error'])
                else:
                    for key, value in data['technical_data'].items():
                        st.write(f"**{key.replace('_', ' ').capitalize()}:** {value}")

                # Display Recent News
                st.subheader("📰 Recent News")
                if data.get('news_data'):
                    for news in data['news_data']:
                        st.write(f"**Title:** {news['title']}")
                        st.write(f"**Snippet:** {news['snippet']}")
                else:
                    st.write("No news articles found.")

                # Display AI Analysis
                st.subheader("🤖 AI Analysis")
                if 'analysis' in data:
                    st.write(data['analysis'])
                else:
                    st.write("No AI analysis available.")
                    
            else:
                st.error("Failed to fetch data from the backend. Please check backend availability.")

        except requests.exceptions.ConnectionError:
            st.error("Failed to connect to the backend. Please ensure the backend is running.")
        except requests.exceptions.RequestException as e:
            st.error(f"Request failed: {str(e)}")
        except Exception as e:
            st.error(f"Unexpected error: {str(e)}")
    else:
        st.warning("Please enter a valid stock symbol.")