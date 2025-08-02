'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

const ticketSchema = z.object({
  type: z.enum(['bug', 'feature', 'support']),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface FileWithPreview extends File {
  preview?: string;
}

export function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileWithPreview[]>([]);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      type: 'support',
      priority: 'medium',
      subject: '',
      description: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
      ].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description:
            'Please upload only images (JPEG, PNG, GIF, WebP), PDF, or text files.',
        });
      }

      if (!isValidSize) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload files smaller than 5MB.',
        });
      }

      return isValidType && isValidSize;
    });

    const newFiles = validFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const file = attachedFiles[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      formData.append('priority', data.priority);

      // Append files
      attachedFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Ticket submitted successfully!',
          description: "We'll review your ticket and get back to you soon.",
        });
        form.reset();
        setAttachedFiles([]);
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Failed to submit ticket',
          description: error.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit ticket. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'feature':
        return '✨';
      case 'support':
        return '💬';
      default:
        return '📝';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Submit a Ticket
        </CardTitle>
        <CardDescription>
          Describe your issue or request and we&apos;ll help you resolve it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ticket Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bug">
                        <span className="flex items-center gap-2">
                          <span>🐛</span>
                          <span>Bug Report</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="feature">
                        <span className="flex items-center gap-2">
                          <span>✨</span>
                          <span>Feature Request</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="support">
                        <span className="flex items-center gap-2">
                          <span>💬</span>
                          <span>Support Question</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your issue"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide detailed information about your issue..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-3">
              <FormLabel>Attachments (optional)</FormLabel>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      Click to upload
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {' '}
                      or drag and drop
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PNG, JPG, GIF, WebP, PDF, TXT up to 5MB each
                  </p>
                </div>
              </div>
            </div>

            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Attached Files</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
