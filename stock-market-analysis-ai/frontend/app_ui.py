import streamlit as st
import requests
import os

# Backend URL Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:8000')  # Default to localhost with port 8000

# Title of the App
st.title("📊 Indian Stock Market Analysis Tool")

# User Input for Stock Symbol
symbol = st.text_input("📈 Enter Stock Symbol (e.g., RELIANCE):").strip()

# Analyze Button
if st.button("Analyze"):
    if not symbol:
        st.warning("⚠️ Please enter a stock symbol to proceed.")
    elif not symbol.isalpha():
        st.warning("⚠️ Invalid stock symbol! Stock symbols should only contain letters (e.g., RELIANCE).")
    else:
        try:
            # Use the backend URL dynamically
            response = requests.get(f"{BACKEND_URL}/analyze/{symbol}")

            if response.status_code == 200:
                data = response.json()

                # Ensure the response contains the necessary keys
                if not data.get('stock_data') and not data.get('technical_data'):
                    st.warning("⚠️ No valid data found for the entered stock symbol. Please check the symbol and try again.")
                else:
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

            elif response.status_code == 404:
                st.error("🚫 Stock symbol not found. Please check and try again.")
            else:
                st.error("❌ Failed to fetch data from the backend. Please try again later.")

        except requests.exceptions.ConnectionError:
            st.error("🚫 Unable to connect to the backend. Please ensure the backend is running.")
        except requests.exceptions.RequestException as e:
            st.error(f"❌ Request failed: {str(e)}")
        except KeyError as e:
            st.warning(f"⚠️ Missing data for key: {e}. Please check the stock symbol and try again.")
        except Exception as e:
            st.error(f"⚠️ An unexpected error occurred: {str(e)}")
