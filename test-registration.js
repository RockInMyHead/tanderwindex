// Тестовый скрипт для проверки API регистрации
const testRegistration = async () => {
  const testUser = {
    username: 'testuser' + Date.now(),
    password: 'testpassword123',
    email: 'test' + Date.now() + '@example.com',
    fullName: 'Test User',
    userType: 'individual',
    location: 'Moscow',
    phone: '+7 (999) 123-45-67'
  };

  console.log('Testing registration with data:', testUser);

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Registration successful:', data);
    } else {
      console.error('Registration failed:', responseText);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Запускаем тест
testRegistration();
