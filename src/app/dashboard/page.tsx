import DashboardPageContent from "@/components/dashboard/DashboardPageContent";

export default function DashboardPage() {
  // Declare and initialize trendData
  const trendData = getTrendData(); // Assuming this is a function that fetches your trend data

  // Log the trendData to the console with the updated message
  console.log("PAGE trends", trendData); // Updated log

  return <DashboardPageContent />;
}

// Example function to get trend data (this should be implemented appropriately)
function getTrendData() {
  // Replace with the actual logic to fetch or compute the trend data
  return {
    exampleKey: 'exampleValue'
  };
}

