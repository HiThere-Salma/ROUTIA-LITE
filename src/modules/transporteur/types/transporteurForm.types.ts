import { z } from 'zod'

export const transporteurFormSchema = z.object({
  nom: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  prenom: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  cin: z.string().min(4, 'CIN requis').max(20),
  telephone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  adresse: z.string().min(2, 'Adresse requise'),
  numero_permis: z.string().min(4, 'N° permis requis'),
  permis_valide: z.boolean(),
  assurance_valide: z.boolean(),
  visite_valide: z.boolean(),
})

export type TransporteurFormValues = z.infer<typeof transporteurFormSchema>
