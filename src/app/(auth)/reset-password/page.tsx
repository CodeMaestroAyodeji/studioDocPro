import { Suspense } from 'react';
import ResetPasswordForm from './form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Loading...</p>
            </CardContent>
        </Card>
    }>
        <ResetPasswordForm />
    </Suspense>
  );
}