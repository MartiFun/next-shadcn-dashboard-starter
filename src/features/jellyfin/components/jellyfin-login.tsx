'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Server, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Schéma de validation pour le formulaire de connexion
const loginSchema = z.object({
  serverUrl: z
    .string()
    .min(1, 'Server URL is required')
    .url('Please enter a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://'
    ),
  username: z
    .string()
    .min(1, 'Username is required')
    .min(2, 'Username must be at least 2 characters'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface JellyfinLoginProps {
  onLogin: (serverUrl: string, username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  initialServerUrl?: string;
  onClearError?: () => void;
}

export default function JellyfinLogin({
  onLogin,
  isLoading = false,
  error = null,
  initialServerUrl = '',
  onClearError,
}: JellyfinLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      serverUrl: initialServerUrl,
      username: '',
      password: '',
    },
    mode: 'onChange',
  });

  const serverUrl = watch('serverUrl');

  const onSubmit = async (data: LoginFormData) => {
    if (onClearError) {
      onClearError();
    }
    
    setIsConnecting(true);
    
    try {
      await onLogin(data.serverUrl, data.username, data.password);
    } catch (err) {
      // L'erreur est gérée par le parent
    } finally {
      setIsConnecting(false);
    }
  };

  const handleServerUrlChange = (url: string) => {
    setValue('serverUrl', url, { shouldValidate: true });
    if (onClearError) {
      onClearError();
    }
  };

  const isFormLoading = isLoading || isConnecting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Connect to Jellyfin</CardTitle>
          <CardDescription>
            Enter your Jellyfin server details to access your media library
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server URL Field */}
            <div className="space-y-2">
              <Label htmlFor="serverUrl" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server URL
              </Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder="https://your-jellyfin-server.com"
                disabled={isFormLoading}
                {...register('serverUrl')}
                onChange={(e) => handleServerUrlChange(e.target.value)}
                className={errors.serverUrl ? 'border-destructive' : ''}
              />
              {errors.serverUrl && (
                <p className="text-sm text-destructive">
                  {errors.serverUrl.message}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                disabled={isFormLoading}
                {...register('username')}
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  disabled={isFormLoading}
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isFormLoading || !isValid}
            >
              {isFormLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Jellyfin'
              )}
            </Button>
          </form>

          {/* Server Status */}
          {serverUrl && !errors.serverUrl && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Server Information
              </h4>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-mono text-xs">{serverUrl}</span>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Don't have a Jellyfin server?{' '}
              <a
                href="https://jellyfin.org/docs/general/installation/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Learn how to set one up
              </a>
            </p>
            <p>
              Make sure your server is accessible and CORS is configured properly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}