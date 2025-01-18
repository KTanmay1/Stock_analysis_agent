import streamlit as st
import requests
import os
import pandas as pd

# Backend URL Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:8000')

# Initialize session state if not exists
if 'current_page' not in st.session_state:
    st.session_state.current_page = "🔥 Trending Stocks"
if 'symbol_to_analyze' not in st.session_state:
    st.session_state.symbol_to_analyze = ""

# Title of the App
st.title("📊 Indian Stock Market Analysis Tool")

# Function to handle stock analysis button clicks
def analyze_stock_callback(symbol):
    st.session_state.symbol_to_analyze = symbol
    st.session_state.current_page = "📈 Stock Analysis"

# Sidebar for navigation
page = st.sidebar.selectbox(
    "Choose a Page",
    ["🔥 Trending Stocks", "📈 Stock Analysis"],
    key='page_selection',
    index=0 if st.session_state.current_page == "🔥 Trending Stocks" else 1
)

# Update current page in session state
st.session_state.current_page = page

if page == "🔥 Trending Stocks":
    st.header("Trending Stocks in Indian Market")
    
    try:
        # Fetch trending stocks data from backend
        response = requests.get(f"{BACKEND_URL}/trending")
        
        if response.status_code == 200:
            trending_data = response.json()
            
            # Display Top Movers
            st.subheader("📈 Top Movers (Last 5 Days)")
            col1, col2 = st.columns(2)
            
            with col1:
                for stock in trending_data['top_movers']:
                    with st.expander(f"{stock['symbol']} ({stock['sector']})"):
                        st.write(f"**Price:** ₹{stock['current_price']}")
                        st.write(f"**5-Day Performance:** {stock['performance_5d']}%")
                        # Modified button with callback
                        if st.button(f"Analyze {stock['symbol']}", 
                                   key=f"analyze_{stock['symbol']}", 
                                   on_click=analyze_stock_callback, 
                                   args=(stock['symbol'],)):
                            st.rerun()

            # Display Most Active Stocks
            st.subheader("📊 Most Active Stocks")
            for stock in trending_data['most_active']:
                with st.expander(f"{stock['symbol']} ({stock['sector']})"):
                    st.write(f"**Price:** ₹{stock['current_price']}")
                    st.write(f"**Average Volume:** {stock['avg_volume']:,}")
                    # Modified button with callback
                    if st.button(f"Analyze {stock['symbol']}", 
                               key=f"analyze_active_{stock['symbol']}", 
                               on_click=analyze_stock_callback, 
                               args=(stock['symbol'],)):
                        st.rerun()

            # Display Sector Performance
            st.subheader("🏢 Sector Performance (5 Days)")
            sector_data = trending_data['sector_performance']
            
            try:
                import plotly.graph_objects as go
                
                fig = go.Figure(data=[
                    go.Bar(
                        x=list(sector_data.keys()),
                        y=list(sector_data.values()),
                        marker_color=['green' if x > 0 else 'red' for x in sector_data.values()]
                    )
                ])
                
                fig.update_layout(
                    title="Sector Performance",
                    xaxis_title="Sector",
                    yaxis_title="Performance (%)",
                    height=400
                )
                
                st.plotly_chart(fig)
                
            except Exception as e:
                st.error(f"Error displaying sector performance chart: {str(e)}")
                # Fallback to text display
                for sector, performance in sorted(sector_data.items(), key=lambda x: x[1], reverse=True):
                    st.write(f"{sector}: {performance}%")
            
        else:
            st.error("Failed to fetch trending stocks data.")
            
    except Exception as e:
        st.error(f"Error fetching trending stocks: {str(e)}")

else:  # Stock Analysis page
    # Get symbol from session state
    initial_symbol = st.session_state.symbol_to_analyze

    # User Input for Stock Symbol
    symbol = st.text_input("Enter Stock Symbol (e.g., RELIANCE):", value=initial_symbol)

    # Clear session state after getting the initial value
    if st.session_state.symbol_to_analyze:
        st.session_state.symbol_to_analyze = ""

    # Add analyze button after the text input
    if st.button("Analyze Stock"):
        if not symbol:
            st.warning("⚠️ Please enter a stock symbol to proceed.")
        elif not symbol.isalpha():
            st.warning("⚠️ Invalid stock symbol! Stock symbols should only contain letters (e.g., RELIANCE).")
        else:
            try:
                with st.spinner(f'Analyzing {symbol}...'):
                    response = requests.get(f"{BACKEND_URL}/analyze/{symbol}")

                    if response.status_code == 200:
                        data = response.json()

                        # If the backend does not return any data
                        if not data.get('stock_data') and not data.get('technical_data') and not data.get('news_data') and not data.get('analysis'):
                            st.warning("⚠️ No valid data found for the entered stock symbol. Please check the symbol and try again.")
                        else:
                            # Create tabs for different sections
                            tabs = st.tabs(["Stock Data", "Technical Analysis", "News", "AI Analysis"])

                            # Stock Data Tab
                            with tabs[0]:
                                st.subheader("📈 Stock Data")
                                if 'error' in data.get('stock_data', {}):
                                    st.error(data['stock_data']['error'])
                                else:
                                    col1, col2 = st.columns(2)
                                    stock_data = data['stock_data']
                                    keys = list(stock_data.keys())
                                    mid = len(keys) // 2

                                    with col1:
                                        for key in keys[:mid]:
                                            st.write(f"**{key.replace('_', ' ').capitalize()}:** {stock_data[key]}")
                                    with col2:
                                        for key in keys[mid:]:
                                            st.write(f"**{key.replace('_', ' ').capitalize()}:** {stock_data[key]}")

                            # Technical Analysis Tab
                            with tabs[1]:
                                st.subheader("📊 Technical Indicators")
                                if 'technical_data' not in data:
                                    st.error("Technical analysis data is not available for this stock.")
                                elif 'error' in data['technical_data']:
                                    st.error(data['technical_data']['error'])
                                else:
                                    col1, col2 = st.columns(2)
                                    tech_data = data['technical_data']
                                    keys = list(tech_data.keys())
                                    mid = len(keys) // 2

                                    with col1:
                                        for key in keys[:mid]:
                                            st.write(f"**{key.replace('_', ' ').capitalize()}:** {tech_data[key]}")
                                    with col2:
                                        for key in keys[mid:]:
                                            st.write(f"**{key.replace('_', ' ').capitalize()}:** {tech_data[key]}")

                            # News Tab
                            with tabs[2]:
                                st.subheader("📰 Recent News")
                                if 'news_data' not in data:
                                    st.error("No news data is available for this stock.")
                                elif not data['news_data']:
                                    st.info("No recent news found for this stock.")
                                else:
                                    for news in data['news_data']:
                                        with st.expander(news['title'] if news['title'] else "Untitled"):
                                            st.write(news['snippet'])

                            # AI Analysis Tab
                            with tabs[3]:
                                st.subheader("🤖 AI Analysis")
                                if 'analysis' not in data:
                                    st.error("AI analysis is not available for this stock.")
                                elif isinstance(data['analysis'], str):
                                    st.write(data['analysis'])
                                else:
                                    st.error("The AI analysis format is invalid.")

                    elif response.status_code == 404:
                        st.error("🚫 The stock symbol was not found. Please verify the symbol and try again.")
                    elif response.status_code == 500:
                        st.error("❌ An internal server error occurred while analyzing the stock. Please try again later.")
                    else:
                        st.error(f"❌ Unexpected error: {response.status_code}. Please try again later.")

            except requests.exceptions.ConnectionError:
                st.error("🚫 Unable to connect to the backend. Please ensure the backend is running and reachable.")
            except requests.exceptions.RequestException as e:
                st.error(f"❌ An error occurred while fetching data: {str(e)}")
            except Exception as e:
                st.error(f"⚠️ An unexpected error occurred: {str(e)}")
    else:
        st.info("Enter a stock symbol above and click 'Analyze Stock' to analyze.")





# Add footer
st.markdown("""
---
Made with ❤️ for Indian Stock Market Analysis
""")
