
export class User {
  static async me() {
    // In a real app, this would fetch from a session
    const stored = localStorage.getItem('currentUser');
    if (stored) return JSON.parse(stored);
    
    // Default admin user for demonstration
    const defaultAdmin = {
      email: "marconifabiano@gmail.com",
      full_name: "Marconi Fabian",
      registration: "987654321", // Added mock registration
      admin: true
    };
    localStorage.setItem('currentUser', JSON.stringify(defaultAdmin));
    return defaultAdmin;
  }

  static async login() {
    // Simple redirect mock
    console.log("Mock Login Triggered");
  }
}
