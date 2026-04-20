import { z } from 'zod'

export const agriculteurFormSchema = z.object({
  nom: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  prenom: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  cin: z.string().min(4, 'CIN requis').max(20),
  telephone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  adresse: z.string().min(2, 'Adresse requise'),
})

export type AgriculteurFormValues = z.infer<typeof agriculteurFormSchema>
