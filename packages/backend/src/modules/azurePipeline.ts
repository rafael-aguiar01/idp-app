import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  createTemplateAction,
  scaffolderActionsExtensionPoint,
} from '@backstage/plugin-scaffolder-node';

function createAzurePipelineAction() {
  return createTemplateAction({
    id: 'azure:pipeline:create',
    description: 'Cria uma Azure Pipeline para um repositório Azure DevOps',

    schema: {
      input: {
        organization: z =>
          z.string().describe('Azure DevOps organization'),

        project: z =>
          z.string().describe('Azure DevOps project'),

        repository: z =>
          z.string().describe('Nome do repositório'),

        yamlPath: z =>
          z.string().optional().describe('Caminho do azure-pipelines.yml'),
      },

      output: {
        pipelineId: z => z.number(),
      },
    },

    async handler(ctx) {
      const {
        organization,
        project,
        repository,
        yamlPath = '/azure-pipelines.yml',
      } = ctx.input;

      const token = process.env.AZURE_DEVOPS_TOKEN;

      if (!token) {
        throw new Error('AZURE_DEVOPS_TOKEN não está configurado');
      }

      const authorization = Buffer.from(`:${token}`).toString('base64');

      ctx.logger.info(
        `Buscando repositório ${organization}/${project}/${repository}`,
      );

      const repositoryUrl =
        `https://dev.azure.com/${encodeURIComponent(organization)}` +
        `/${encodeURIComponent(project)}` +
        `/_apis/git/repositories/${encodeURIComponent(repository)}` +
        `?api-version=7.1`;

      const repositoryResponse = await fetch(repositoryUrl, {
        headers: {
          Authorization: `Basic ${authorization}`,
          Accept: 'application/json',
        },
      });

      if (!repositoryResponse.ok) {
        const body = await repositoryResponse.text();

        throw new Error(
          `Erro ao buscar repositório Azure DevOps: ` +
            `${repositoryResponse.status} ${body}`,
        );
      }

      const repositoryData = (await repositoryResponse.json()) as {
        id: string;
        name: string;
      };

      ctx.logger.info(
        `Repositório encontrado: ${repositoryData.id}`,
      );

      const pipelineUrl =
        `https://dev.azure.com/${encodeURIComponent(organization)}` +
        `/${encodeURIComponent(project)}` +
        `/_apis/pipelines?api-version=7.1`;

      const pipelineResponse = await fetch(pipelineUrl, {
        method: 'POST',

        headers: {
          Authorization: `Basic ${authorization}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },

        body: JSON.stringify({
          name: repository,

          configuration: {
            type: 'yaml',
            path: yamlPath,

            repository: {
              id: repositoryData.id,
              name: repositoryData.name,
              type: 'azureReposGit',
            },
          },
        }),
      });

      if (!pipelineResponse.ok) {
        const body = await pipelineResponse.text();

        throw new Error(
          `Erro ao criar Azure Pipeline: ` +
            `${pipelineResponse.status} ${body}`,
        );
      }

      const pipeline = (await pipelineResponse.json()) as {
        id: number;
        name: string;
      };

      ctx.logger.info(
        `Azure Pipeline criada: ${pipeline.name} (${pipeline.id})`,
      );

      ctx.output('pipelineId', pipeline.id);
    },
  });
}

export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'azure-pipeline',

  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
      },

      async init({ scaffolder }) {
        scaffolder.addActions(createAzurePipelineAction());
      },
    });
  },
});