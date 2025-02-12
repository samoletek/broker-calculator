'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/client/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    'data-state'?: 'open' | 'closed'
  }
>(({ className, children, 'data-state': dataState, ...props }, ref) => {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex flex-1 cursor-pointer items-center',
          className
        )}
        {...props}
      >
        {children}
        <motion.div
          animate={{ 
            rotate: dataState === 'open' ? 180 : 0,
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 ml-4 text-gray-500" />
        </motion.div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <AccordionPrimitive.Content 
      ref={ref} 
      {...props}
    >
      <motion.div
        initial={{ 
          height: 0, 
          opacity: 0,
          marginTop: 0
        }}
        animate={{ 
          height: "auto", 
          opacity: 1,
          marginTop: 8
        }}
        exit={{ 
          height: 0, 
          opacity: 0,
          marginTop: 0
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={cn('overflow-hidden', className)}
      >
        {children}
      </motion.div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };