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

const resetSchema = z.object({
  password: z.string().min(6, { message: 'Пароль должен быть не менее 6 символов' }),
  confirm: z.string().min(1, { message: 'Подтвердите пароль' }),
}).refine(data => data.password === data.confirm, {
  message: 'Пароли не совпадают',
  path: ['confirm'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword({ params }: { params: { token: string } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (values: ResetForm) => {
    setIsSubmitting(true);
    try {
      const data = await resetPassword(params.token, values.password);
      toast({ title: 'Пароль изменён', description: data.message });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message || 'Не удалось изменить пароль', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Сброс пароля</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Новый пароль</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Новый пароль" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтвердите пароль</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Подтвердите пароль" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Сброс...' : 'Сбросить пароль'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
