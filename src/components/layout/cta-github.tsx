import React from 'react';
import { Button } from '@/components/ui/button';
import { IconServer2 } from '@tabler/icons-react';

export default function CtaGithub() {
  return (
    <Button variant='ghost' asChild size='sm' className='hidden sm:flex'>
      <a
        href='https://www.ug.link/martinas'
        rel='noopener noreferrer'
        target='_blank'
        className='dark:text-foreground'
      >
        NAS UGREEN
        <IconServer2 />
      </a>
    </Button>
  );
}
