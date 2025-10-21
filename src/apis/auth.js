// api/auth.js
export async function loginUser(email, password, role) {
  try {
    // Example dummy API (replace with your backend endpoint)
    const response = await fetch('https://your-api.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data; // return user data or token
  } catch (error) {
    throw error;
  }
}
