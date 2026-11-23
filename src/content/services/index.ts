import type { Service, ServiceFaq } from '@/types';
import { civilServices } from './civil';
import { empresarialServices } from './empresarial';
import { familiaServices } from './familia';
import { penalServices } from './penal';
import type { DemoService } from './shared';

export type { DemoService } from './shared';

/** Los 15 servicios de demostración, agrupados por área en orden de aparición. */
export const demoServicesWithFaqs: DemoService[] = [
  ...familiaServices,
  ...penalServices,
  ...civilServices,
  ...empresarialServices,
];

export const demoServices: Service[] = demoServicesWithFaqs.map(({ faqs: _faqs, ...service }) => service);

export const demoServiceFaqs: ServiceFaq[] = demoServicesWithFaqs.flatMap((service) => service.faqs);

export const demoServiceBySlug = (slug: string) =>
  demoServicesWithFaqs.find((service) => service.slug === slug);
