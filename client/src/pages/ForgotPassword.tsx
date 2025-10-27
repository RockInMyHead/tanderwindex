import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const forgotSchema = z.object({
  email: z.string().email({ message: 'Введите корректный email' }),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotForm) => {
    setIsSubmitting(true);
    try {
      const data = await forgotPassword(values.email);
      toast({ title: 'Письмо отправлено', description: data.message });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message || 'Не удалось отправить письмо', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Восстановление пароля</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Ваш email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Отправка...' : 'Отправить письмо'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
