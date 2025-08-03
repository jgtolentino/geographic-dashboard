// API client for chat endpoint
export async function sendChatMessage(messages: any[], context: any) {
  // For now, return mock responses since we need a backend server
  // In production, this would stream from your backend API
  
  const lastMessage = messages[messages.length - 1].content.toLowerCase()
  
  let response = ''
  
  if (lastMessage.includes('revenue') || lastMessage.includes('sales')) {
    response = `Based on the current data, your total revenue for the last 7 days is ₱1,245,832, which represents a 12.5% increase compared to the previous week. The beverages category is driving most of this growth with a 23% increase. 

Key insights:
- Daily average revenue: ₱177,976
- Top performing category: Beverages (₱425,320)
- Peak revenue day: Saturday with ₱215,430`
  } else if (lastMessage.includes('customer') || lastMessage.includes('behavior')) {
    response = `Customer behavior analysis shows interesting patterns:

- Peak shopping hours: 3-5 PM (42% of daily transactions)
- Average basket size: ₱245
- Repeat customer rate: 68%
- Weekend vs weekday: 35% higher basket values on weekends

I recommend focusing staff coverage during peak hours and creating weekend-specific promotions to maximize revenue.`
  } else if (lastMessage.includes('product') || lastMessage.includes('inventory')) {
    response = `Product performance analysis reveals:

- Top 20% of SKUs generate 78% of revenue (Pareto principle in action)
- Fastest moving items: Beverages, Snacks, Personal Care
- Slow movers: 15% of inventory hasn't sold in 14 days
- Optimal reorder point: When stock reaches 30% of weekly average

Consider reducing slow-moving inventory and reallocating capital to high-performers.`
  } else {
    response = `I can help you analyze various aspects of your business:

- Revenue and sales trends
- Customer behavior patterns  
- Product performance
- Inventory optimization
- Marketing recommendations

What specific area would you like to explore?`
  }

  return response
}