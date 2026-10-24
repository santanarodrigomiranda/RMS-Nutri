import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Função utilitária para chamar a IA do Gemini com retry/fallback entre modelos
 */
export async function executeGerarPlano(dadosDoPaciente: string): Promise<any> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Prompt sem responseMimeType de schema para evitar o erro de "model output must contain output text"
  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosDoPaciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado, sem NENHUM texto adicional.
- NÃO inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.
- Gere exatamente 7 dias: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado, Domingo.
- Cada dia deve ter exatamente 5 opções para cada refeição.

Retorne SOMENTE este JSON (sem nenhum texto antes ou depois):
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`

  // Modelos válidos em ordem de preferência (do mais capaz ao fallback)
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ]

  let lastError: any = null

  for (const modelName of modelsToTry) {
    try {
      console.log(`Tentando modelo: ${modelName}`)

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      })

      const result = await model.generateContent(prompt)

      // Verifica o finishReason
      const candidate = result.response.candidates?.[0]
      const finishReason = candidate?.finishReason

      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        console.warn(`Modelo ${modelName} terminou com finishReason: ${finishReason}`)
        lastError = new Error(`Modelo ${modelName} retornou finishReason inválido: ${finishReason}`)
        continue
      }

      let text = ''
      try {
        text = result.response.text()
      } catch (textErr: any) {
        // O erro "model output must contain either output text or tool calls" acontece aqui
        console.warn(`Erro ao obter texto do modelo ${modelName}:`, textErr.message)
        lastError = textErr
        continue
      }

      if (!text || !text.trim()) {
        console.warn(`Modelo ${modelName} retornou resposta vazia.`)
        lastError = new Error(`Modelo ${modelName} retornou resposta vazia.`)
        continue
      }

      // Limpeza defensiva: remove blocos markdown caso venham
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      // Tenta extrair apenas o JSON caso haja texto extra
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : cleaned

      const parsed = JSON.parse(jsonStr)

      if (!parsed || !Array.isArray(parsed.plano_semanal)) {
        throw new Error('JSON retornado não contém a propriedade plano_semanal.')
      }

      console.log(`Plano gerado com sucesso usando modelo: ${modelName}`)
      return parsed

    } catch (err: any) {
      const status = err.status || err.statusCode || ''
      const msg = err.message || ''
      console.warn(`Tentativa com modelo ${modelName} falhou [${status}]:`, msg)
      lastError = err
      // Continua para o próximo modelo em qualquer erro
    }
  }

  throw lastError || new Error('Não foi possível gerar o plano alimentar com IA no momento.')
}

/**
 * Handler compatível com Vercel Serverless Function
 */
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' })
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        // body remains string
      }
    }

    const { dados_do_paciente, paciente } = body || {}

    // Formata o resumo do paciente caso tenha sido enviado o objeto paciente
    let dadosTexto = ''
    if (dados_do_paciente && typeof dados_do_paciente === 'string') {
      dadosTexto = dados_do_paciente
    } else if (paciente && typeof paciente === 'object') {
      dadosTexto = [
        `Nome: ${paciente.nome || 'Não informado'}`,
        `Sexo: ${paciente.sexo || 'Não informado'}`,
        `Data de Nascimento: ${paciente.data_nascimento || 'Não informada'}`,
        `Peso Inicial: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}`,
        `Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}`,
        `Objetivos: ${Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : 'Não informado'}`,
        `Objetivo Específico: ${paciente.objetivo_texto || 'Nenhum'}`,
        `Nível de Atividade: ${paciente.nivel_atividade || 'Não informado'}`,
        `Patologias: ${Array.isArray(paciente.patologias) ? paciente.patologias.join(', ') : 'Nenhuma'}`,
        `Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma'}`,
        `Alergias Alimentares: ${Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : 'Nenhuma'}`,
        `Medicamentos: ${paciente.medicamentos || 'Nenhum'}`,
        `Suplementos: ${paciente.suplementos || 'Nenhum'}`,
        `Refeições ao dia: ${paciente.refeicoes_por_dia || 'Não informado'}`,
        `Horário que acorda: ${paciente.horario_acorda || 'Não informado'}`,
        `Horário que dorme: ${paciente.horario_dorme || 'Não informado'}`,
        `Consumo de água: ${paciente.litros_agua ? `${paciente.litros_agua} L/dia` : 'Não informado'}`,
        `Prática de Atividade Física: ${paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || 'regular'})` : 'Não'}`,
        `Observações Gerais: ${paciente.observacoes || 'Nenhuma'}`,
      ].join('\n')
    } else {
      dadosTexto = JSON.stringify(body || {}, null, 2)
    }

    if (!dadosTexto.trim()) {
      return res.status(400).json({ error: 'Dados do paciente não fornecidos na requisição.' })
    }

    const planoGerado = await executeGerarPlano(dadosTexto)
    return res.status(200).json(planoGerado)
  } catch (err: any) {
    console.error('Erro ao gerar plano alimentar na API:', err)
    return res.status(500).json({
      error: 'Falha ao gerar plano alimentar com IA.',
      message: err.message || 'Erro interno do servidor.',
    })
  }
}
