/**
 * @module pages/EditMessagePage
 * Edit existing message form (admin only).
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGetMessageById, useUpdateMessage } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const messageSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function EditMessagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetMessageById(id || '');
  const updateMessage = useUpdateMessage(id || '');

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

  // Populate form when message loads
  // Data structure: { success: true, data: Message, requestId: string }
  useEffect(() => {
    if (data?.data) {
      const message = data.data;
      form.reset({
        key: message.key,
        type: message.type,
        category: message.category,
        value: message.value,
        description: message.description || '',
      });
    }
  }, [data, form]);

  const handleSubmit = (formData: MessageFormData) => {
    updateMessage.mutate(formData, {
      onSuccess: () => {
        navigate(-1);
      },
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-100'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className='mx-auto max-w-2xl space-y-6 px-4'>
        <Button variant='outline' onClick={() => navigate(-1)}>
          <ArrowLeft className='size-4 mr-2' />
          Back
        </Button>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>Message not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6 px-4'>
      <Button variant='outline' onClick={() => navigate(-1)}>
        <ArrowLeft className='size-4 mr-2' />
        Back
      </Button>

      <h1 className='text-3xl font-bold'>Edit Message</h1>

      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <FieldGroup>
          <Controller
            name='key'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='key'>Key</FieldLabel>
                <Input {...field} id='key' placeholder='MESSAGE_KEY' disabled={updateMessage.isPending} />
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
                <Input {...field} id='type' placeholder='success, error, etc.' disabled={updateMessage.isPending} />
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
                <Input {...field} id='category' placeholder='auth, user, etc.' disabled={updateMessage.isPending} />
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
                <Input {...field} id='value' placeholder='Message text' disabled={updateMessage.isPending} />
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
                  disabled={updateMessage.isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <div className='flex gap-3'>
          <Button type='submit' disabled={updateMessage.isPending || !form.formState.isValid}>
            {updateMessage.isPending ? 'Updating...' : 'Update Message'}
          </Button>
          <Button type='button' variant='outline' onClick={() => navigate(-1)} disabled={updateMessage.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
