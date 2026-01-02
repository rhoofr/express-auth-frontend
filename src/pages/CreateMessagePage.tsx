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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

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
      onSuccess: (response) => {
        navigate(`/messages/${response.data?.message?.id}`);
      },
    });
  };

  return (
    <div className='space-y-6 max-w-2xl'>
      <Button variant='outline' onClick={() => navigate('/messages')}>
        <ArrowLeft className='size-4 mr-2' />
        Back to Messages
      </Button>

      <h1 className='text-3xl font-bold'>Create New Message</h1>

      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <FieldGroup>
          <Controller
            name='key'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='key'>Key</FieldLabel>
                <Input {...field} id='key' placeholder='MESSAGE_KEY' disabled={createMessage.isPending} />
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
                <Input {...field} id='type' placeholder='success, error, etc.' disabled={createMessage.isPending} />
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
                <Input {...field} id='category' placeholder='auth, user, etc.' disabled={createMessage.isPending} />
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
                <Input {...field} id='value' placeholder='Message text' disabled={createMessage.isPending} />
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
                  disabled={createMessage.isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type='submit' disabled={createMessage.isPending || !form.formState.isValid}>
          {createMessage.isPending ? 'Creating...' : 'Create Message'}
        </Button>
      </form>
    </div>
  );
}
