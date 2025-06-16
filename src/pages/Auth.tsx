import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface AuthFormData {
  email: string;
  username: string;
  password: string;
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isLogin) {
        // Login
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        
        const response = await fetch('http://localhost:8000/token', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Ошибка входа');
        }

        const { access_token } = await response.json();
        localStorage.setItem('token', access_token);
        localStorage.removeItem('guest');
      } else {
        // Register
        const response = await fetch('http://localhost:8000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Ошибка регистрации');
        }

        // After successful registration, switch to login
        setIsLogin(true);
        setError('');
        return;
      }

      // Navigate to chat on successful login
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const handleGuest = () => {
    localStorage.setItem('guest', 'true');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{isLogin ? 'Вход' : 'Регистрация'}</h2>
          <p className="mt-2 text-muted-foreground">
            {isLogin ? 'Добро пожаловать!' : 'Создайте свой аккаунт'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Почта</label>
              <input
                {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                type="email"
                className="w-full p-2 border rounded-md"
                placeholder="youremail@email.com"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">Введите корректную почту</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Имя пользователя</label>
            <input
              {...register('username', { required: true })}
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Имя пользователя"
            />
            {errors.username && (
              <p className="text-destructive text-sm mt-1">Имя пользователя обязательно</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <input
              {...register('password', { required: true, minLength: 6 })}
              type="password"
              className="w-full p-2 border rounded-md"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">
                Пароль должен быть не менее 6 символов
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="flex flex-col gap-2 items-center mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isLogin ? "Нет аккаунта? Зарегистрироваться" : 'Уже есть аккаунт? Войти'}
          </button>
          <button
            onClick={handleGuest}
            className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-4 py-2 mt-2"
          >
            Войти как гость
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth; 