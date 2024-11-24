const users = {}

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Function to get month name from number (1 to 12)
export const getMonthName = (monthNumber) => {
    // Ensure the month number is valid (between 1 and 12)
    if (monthNumber >= 1 && monthNumber <= 12) {
      return months[monthNumber - 1]; // Subtract 1 because array is 0-indexed
    } else {
      return null; // Invalid month number
    }
};

export default users;