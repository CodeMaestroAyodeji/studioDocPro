'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { intelligentFieldCompletion } from '@/ai/flows/intelligent-field-completion';
import { useToast } from '@/hooks/use-toast';

type AISuggestionButtonProps = {
  fieldName: string;
  form: UseFormReturn<any>;
  formSchema: any;
};

export function AISuggestionButton({ fieldName, form, formSchema }: AISuggestionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggestion = async () => {
    setIsLoading(true);
    try {
      const allFields = form.getValues();
      const allFieldKeys = Object.keys(formSchema.shape);
      const currentFieldIndex = allFieldKeys.indexOf(fieldName);

      const precedingFields: Record<string, string> = {};
      for (let i = 0; i < currentFieldIndex; i++) {
        const key = allFieldKeys[i];
        if (allFields[key]) {
          precedingFields[key] = String(allFields[key]);
        }
      }

      const result = await intelligentFieldCompletion({
        documentContent: JSON.stringify(allFields),
        currentField: fieldName,
        precedingFields,
      });

      if (result.suggestedValue) {
        form.setValue(fieldName, result.suggestedValue, { shouldValidate: true });
        toast({
            title: 'Suggestion applied!',
            description: `Filled '${fieldName}' with AI suggestion.`,
          });
      } else {
        toast({
            variant: 'destructive',
            title: 'No suggestion found',
            description: `AI could not find a suggestion for '${fieldName}'.`,
          });
      }
    } catch (error) {
      console.error('AI suggestion failed', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not fetch AI suggestion.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSuggestion}
          disabled={isLoading}
          className="h-7 w-7 text-primary hover:text-primary/80"
        >
          <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Get AI Suggestion</p>
      </TooltipContent>
    </Tooltip>
  );
}
