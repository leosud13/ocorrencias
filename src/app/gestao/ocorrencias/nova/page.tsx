import { OccurrenceForm } from "@/components/occurrence-form";

export default function GestaoNovaOcorrenciaPage() {
  return (
    <OccurrenceForm
      redirectPath="/gestao/ocorrencias"
      title="Nova ocorrência (gestão)"
      description="O registro fica associado ao seu usuário de gestão como autor. Professores continuam vendo apenas as próprias ocorrências."
    />
  );
}
