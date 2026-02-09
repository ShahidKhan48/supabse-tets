import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Clock, AlertTriangle, Upload, X, File } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { formatInIST } from '@/lib/dateUtils';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: number;
  name: string;
}

interface UrgencyLevel {
  id: number;
  label: string;
  sla_hours: number;
}

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
}


const createTicketSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  categoryId: z.string().min(1, "Category is required"),
  urgencyId: z.string().min(1, "Urgency level is required"),
  description: z.string().min(20, "Description must be at least 20 characters")
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { compactMode } = useViewMode();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<UrgencyLevel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      urgencyId: '',
      description: ''
    }
  });

  useEffect(() => {
    fetchCategories();
    fetchUrgencyLevels();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    }
  };

  const fetchUrgencyLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('urgency_levels')
        .select('*')
        .order('id');
      
      if (error) throw error;
      setUrgencyLevels(data || []);
    } catch (error) {
      console.error('Error fetching urgency levels:', error);
      toast({
        title: "Error",
        description: "Failed to load urgency levels",
        variant: "destructive"
      });
    }
  };


  const uploadFilesToStorage = async (ticketId: string): Promise<boolean> => {
    if (uploadedFiles.length === 0) return true;

    try {
      const uploadPromises = uploadedFiles.map(async (uploadFile) => {
        const fileName = `${user!.id}/${ticketId}/${uploadFile.file.name}`;
        
        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 0 }));

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, uploadFile.file);

        if (uploadError) throw uploadError;

        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 50 }));

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            file_name: uploadFile.file.name,
            file_path: fileName,
            file_type: uploadFile.file.type,
            file_size: uploadFile.file.size,
            uploaded_by: user!.id,
            uploaded_context: 'creation'
          });

        if (attachmentError) throw attachmentError;

        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 100 }));
      });

      await Promise.all(uploadPromises);
      return true;
    } catch (error) {
      console.error('Error uploading files:', error);
      return false;
    }
  };

  const onSubmit = async (data: CreateTicketForm) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a ticket",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: data.title,
          description: data.description,
          category_id: parseInt(data.categoryId),
          urgency_id: parseInt(data.urgencyId),
          created_by: user.id,
          status: 'new'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Upload files if any
      const filesUploaded = await uploadFilesToStorage(ticket.id);
      if (!filesUploaded) {
        toast({
          title: "Warning",
          description: "Ticket created but some files failed to upload",
          variant: "destructive"
        });
      }

      toast({
        title: "Success!",
        description: `Ticket ${ticket.display_id} created successfully`,
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrgencyChange = (urgencyId: string) => {
    const urgency = urgencyLevels.find(u => u.id.toString() === urgencyId);
    setSelectedUrgency(urgency || null);
    form.setValue('urgencyId', urgencyId);
  };

  const getSLADeadline = () => {
    if (!selectedUrgency) return null;
    
    // Get current IST time
    const nowIST = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const utcTime = nowIST.getTime() + (nowIST.getTimezoneOffset() * 60 * 1000);
    const currentISTTime = new Date(utcTime + istOffset);
    
    // Add SLA hours to current IST time
    const deadline = new Date(currentISTTime.getTime() + (selectedUrgency.sla_hours * 60 * 60 * 1000));
    return deadline;
  };

  const formatSLATime = (deadline: Date) => {
    return formatInIST(deadline, 'M/d/yyyy \'at\' h:mm:ss a \'IST\'');
  };

  const getPriorityColor = (label: string) => {
    switch (label) {
      case 'P1': return 'destructive';
      case 'P2': return 'default';
      case 'P3': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (label: string) => {
    switch (label) {
      case 'P1': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to create a support ticket.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Dynamic spacing based on compact mode
  const cardPadding = compactMode ? 'p-4' : 'p-6';
  const spacing = compactMode ? 'space-y-4' : 'space-y-6';

  return (
    <div className={`min-h-screen bg-background ${cardPadding}`}>
      <div className="max-w-2xl mx-auto">
        <div className={compactMode ? 'mb-4' : 'mb-6'}>
          <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold`}>Create Support Ticket</h1>
          <p className={`text-muted-foreground ${compactMode ? 'text-sm' : ''}`}>
            Provide detailed information to help us resolve your issue quickly.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={spacing}>
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
                <CardDescription>
                  Basic details about your issue
                </CardDescription>
              </CardHeader>
              <CardContent className={spacing}>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of the issue..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/10 characters minimum
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgencyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level *</FormLabel>
                        <Select onValueChange={handleUrgencyChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {urgencyLevels.map((urgency) => (
                              <SelectItem key={urgency.id} value={urgency.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  {getPriorityIcon(urgency.label)}
                                  <span>{urgency.label}</span>
                                  <Badge variant={getPriorityColor(urgency.label)} className="ml-auto">
                                    {urgency.sla_hours}h SLA
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedUrgency && (
                  <div className="p-4 bg-accent/50 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">Expected SLA Target</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target resolution by: <strong>{formatSLATime(getSLADeadline()!)}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedUrgency.sla_hours} hour SLA for {selectedUrgency.label} priority tickets
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information about the issue, including steps to reproduce, expected behavior, and any error messages..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/20 characters minimum
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Attachments</h3>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      {isDragActive ? (
                        <p className="text-sm text-muted-foreground">Drop files here...</p>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Drag & drop files here, or click to select
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Max 5 files, 10MB each. Supports images, PDF, and documents.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((uploadFile) => (
                        <div
                          key={uploadFile.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{uploadFile.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(uploadFile.file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {uploadProgress[uploadFile.id] !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {uploadProgress[uploadFile.id]}%
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadFile.id)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateTicket;