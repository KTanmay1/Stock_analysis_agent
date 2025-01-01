import streamlit as st
import requests
import os

# Backend URL Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:8000')

# Title of the App
st.title("📊 Indian Stock Market Analysis Tool")

# Sidebar for navigation
page = st.sidebar.selectbox(
    "Choose a Page",
    ["🔥 Trending Stocks", "📈 Stock Analysis"]
)

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
                        # Add analyze button for each trending stock
                        if st.button(f"Analyze {stock['symbol']}", key=f"analyze_{stock['symbol']}"):
                            st.session_state.symbol_to_analyze = stock['symbol']
                            st.session_state.page = "Stock Analysis"
                            st.experimental_rerun()
            
            # Display Most Active Stocks
            st.subheader("📊 Most Active Stocks")
            for stock in trending_data['most_active']:
                with st.expander(f"{stock['symbol']} ({stock['sector']})"):
                    st.write(f"**Price:** ₹{stock['current_price']}")
                    st.write(f"**Average Volume:** {stock['avg_volume']:,}")
                    if st.button(f"Analyze {stock['symbol']}", key=f"analyze_active_{stock['symbol']}"):
                        st.session_state.symbol_to_analyze = stock['symbol']
                        st.session_state.page = "Stock Analysis"
                        st.experimental_rerun()
            
            # Display Sector Performance
            st.subheader("🏢 Sector Performance (5 Days)")
            sector_data = trending_data['sector_performance']
            
            # Create a bar chart for sector performance
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
            
        else:
            st.error("Failed to fetch trending stocks data.")
            
    except Exception as e:
        st.error(f"Error fetching trending stocks: {str(e)}")

else:  # Stock Analysis page
    # Get symbol from session state if available
    symbol = st.session_state.get('symbol_to_analyze', '')
    
    # User Input for Stock Symbol
    symbol = st.text_input("Enter Stock Symbol (e.g., RELIANCE):", value=symbol)
    
    # Clear session state after using it
    if 'symbol_to_analyze' in st.session_state:
        del st.session_state.symbol_to_analyze

    # Analyze Button
    if st.button("Analyze") or symbol:  # Auto-analyze if symbol is from trending page
        if symbol:
            try:
                response = requests.get(f"{BACKEND_URL}/analyze/{symbol}")
                
                if response.status_code == 200:
                    data = response.json()
                    
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
                        if 'error' in data.get('technical_data', {}):
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
                        if data.get('news_data'):
                            for news in data['news_data']:
                                with st.expander(news['title']):
                                    st.write(news['snippet'])
                        else:
                            st.write("No news articles found.")
                    
                    # AI Analysis Tab
                    with tabs[3]:
                        st.subheader("🤖 AI Analysis")
                        if 'analysis' in data:
                            st.write(data['analysis'])
                        else:
                            st.write("No AI analysis available.")
                            
                else:
                    st.error("Failed to fetch data from the backend.")
                    
            except requests.exceptions.ConnectionError:
                st.error("Failed to connect to the backend. Please ensure the backend is running.")
            except requests.exceptions.RequestException as e:
                st.error(f"Request failed: {str(e)}")
            except Exception as e:
                st.error(f"Unexpected error: {str(e)}")
        else:
            st.warning("Please enter a valid stock symbol.")

# Add footer
st.markdown("""
---
Made with ❤️ for Indian Stock Market Analysis
""")

