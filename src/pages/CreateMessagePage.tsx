/**
 * @module pages/CreateMessagePage
 * Create new message form (admin only).
 */
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateMessage } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { messageTypes, messageCategories } from '@/lib/constants';

const messageSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function CreateMessagePage() {
  const navigate = useNavigate();
  const createMessage = useCreateMessage();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      key: '',
      type: '',
      category: '',
      value: '',
      description: '',
    },
  });

  const handleSubmit = (data: MessageFormData) => {
    createMessage.mutate(data, {
      onSuccess: () => {
        navigate('/messages');
      },
    });
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6 px-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl'>Create New Message</CardTitle>
              <CardDescription>Add a new message to the system</CardDescription>
            </div>
            <div>
              <Button variant='outline' onClick={() => navigate('/messages')}>
                <ArrowLeft className='size-4 mr-2' />
                Back to Messages
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
            <FieldGroup>
              <Controller
                name='key'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='key'>Key</FieldLabel>
                    <Input
                      {...field}
                      id='key'
                      placeholder='MESSAGE_KEY'
                      aria-invalid={fieldState.invalid}
                      disabled={createMessage.isPending}
                      autoFocus
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='type'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='type'>Type</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={createMessage.isPending}>
                      <SelectTrigger id='type' aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder='Select a type' />
                      </SelectTrigger>
                      <SelectContent>
                        {messageTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='category'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='category'>Category</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={createMessage.isPending}>
                      <SelectTrigger id='category' aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                      <SelectContent>
                        {messageCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='value'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='value'>Value</FieldLabel>
                    <Input
                      {...field}
                      id='value'
                      placeholder='Message text'
                      aria-invalid={fieldState.invalid}
                      disabled={createMessage.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='description'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='description'>Description (optional)</FieldLabel>
                    <Input
                      {...field}
                      id='description'
                      placeholder='Optional description'
                      aria-invalid={fieldState.invalid}
                      disabled={createMessage.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type='submit' className='w-full' disabled={createMessage.isPending || !form.formState.isValid}>
              {createMessage.isPending ? (
                <>
                  <Loader2 className='size-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Message'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
