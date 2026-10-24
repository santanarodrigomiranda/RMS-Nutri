import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import bodyParser from 'body-parser'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { executeGerarPlano } from './api/gerar-plano.ts'

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-gerar-plano',
    configureServer(server) {
      server.middlewares.use(bodyParser.json())
      server.middlewares.use(async (req, res, next) => {
        const url = (req.originalUrl || req.url || '').split('?')[0]
        if (url === '/api/gerar-plano' && req.method === 'POST') {
          try {
            const body = (req as any).body || {}
            const { dados_do_paciente, paciente } = body

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
              dadosTexto = JSON.stringify(body, null, 2)
            }

            const plano = await executeGerarPlano(dadosTexto)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify(plano))
          } catch (err: any) {
            console.error('Erro na rota /api/gerar-plano local:', err)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: 'Falha ao gerar plano com IA',
                message: err.message || 'Erro interno',
              })
            )
          }
        } else {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
  }

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
