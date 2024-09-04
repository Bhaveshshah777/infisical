import { z } from "zod";

import { SlackIntegrationsSchema } from "@app/db/schemas";
import { EventType } from "@app/ee/services/audit-log/audit-log-types";
import { getConfig } from "@app/lib/config/env";
import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerSlackRouter = async (server: FastifyZodProvider) => {
  const appCfg = getConfig();

  server.route({
    method: "GET",
    url: "/install",
    config: {
      rateLimit: readLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      querystring: z.object({
        slug: z.string(),
        description: z.string().optional()
      }),
      response: {
        200: z.string()
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const url = await server.services.slack.getInstallUrl({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        ...req.query
      });

      await server.services.auditLog.createAuditLog({
        ...req.auditLogInfo,
        orgId: req.permission.orgId,
        event: {
          type: EventType.ATTEMPT_CREATE_SLACK_INTEGRATION,
          metadata: {
            slug: req.query.slug,
            description: req.query.description
          }
        }
      });

      return url;
    }
  });

  server.route({
    method: "GET",
    url: "/reinstall",
    config: {
      rateLimit: readLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      querystring: z.object({
        slackIntegrationId: z.string()
      }),
      response: {
        200: z.string()
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const url = await server.services.slack.getReinstallUrl({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.query.slackIntegrationId
      });

      await server.services.auditLog.createAuditLog({
        ...req.auditLogInfo,
        orgId: req.permission.orgId,
        event: {
          type: EventType.ATTEMPT_REINSTALL_SLACK_INTEGRATION,
          metadata: {
            id: req.query.slackIntegrationId
          }
        }
      });

      return url;
    }
  });

  server.route({
    method: "GET",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: SlackIntegrationsSchema.pick({
          id: true,
          slug: true,
          description: true,
          teamName: true
        }).array()
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const slackIntegrations = await server.services.slack.getSlackIntegrationsByOrg({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId
      });

      return slackIntegrations;
    }
  });

  server.route({
    method: "DELETE",
    url: "/:slackIntegrationId",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      params: z.object({
        slackIntegrationId: z.string()
      }),
      response: {
        200: SlackIntegrationsSchema.pick({
          id: true,
          slug: true,
          description: true,
          teamName: true
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const deletedSlackIntegration = await server.services.slack.deleteSlackIntegration({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.params.slackIntegrationId
      });

      await server.services.auditLog.createAuditLog({
        ...req.auditLogInfo,
        orgId: deletedSlackIntegration.orgId,
        event: {
          type: EventType.DELETE_SLACK_INTEGRATION,
          metadata: {
            id: deletedSlackIntegration.id
          }
        }
      });

      return deletedSlackIntegration;
    }
  });

  server.route({
    method: "GET",
    url: "/:slackIntegrationId",
    config: {
      rateLimit: readLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      params: z.object({
        slackIntegrationId: z.string()
      }),
      response: {
        200: SlackIntegrationsSchema.pick({
          id: true,
          slug: true,
          description: true,
          teamName: true
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const slackIntegration = await server.services.slack.getSlackIntegrationById({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.params.slackIntegrationId
      });

      await server.services.auditLog.createAuditLog({
        ...req.auditLogInfo,
        orgId: slackIntegration.orgId,
        event: {
          type: EventType.GET_SLACK_INTEGRATION,
          metadata: {
            id: slackIntegration.id
          }
        }
      });

      return slackIntegration;
    }
  });

  server.route({
    method: "PATCH",
    url: "/:slackIntegrationId",
    config: {
      rateLimit: readLimit
    },
    schema: {
      security: [
        {
          bearerAuth: []
        }
      ],
      params: z.object({
        slackIntegrationId: z.string()
      }),
      body: z.object({
        slug: z.string().optional(),
        description: z.string().optional()
      }),
      response: {
        200: SlackIntegrationsSchema.pick({
          id: true,
          slug: true,
          description: true,
          teamName: true
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const slackIntegration = await server.services.slack.updateSlackIntegration({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.params.slackIntegrationId,
        ...req.body
      });

      await server.services.auditLog.createAuditLog({
        ...req.auditLogInfo,
        orgId: slackIntegration.orgId,
        event: {
          type: EventType.UPDATE_SLACK_INTEGRATION,
          metadata: {
            id: slackIntegration.id,
            slug: slackIntegration.slug,
            description: slackIntegration.description as string
          }
        }
      });

      return slackIntegration;
    }
  });

  server.route({
    method: "GET",
    url: "/oauth_redirect",
    config: {
      rateLimit: readLimit
    },
    handler: async (req, res) => {
      const installer = await server.services.slack.getSlackInstaller();

      return installer.handleCallback(req.raw, res.raw, {
        failureAsync: async () => {
          return res.redirect(appCfg.SITE_URL as string);
        },
        successAsync: async (installation) => {
          const metadata = JSON.parse(installation.metadata || "") as {
            orgId: string;
          };

          return res.redirect(`${appCfg.SITE_URL}/org/${metadata.orgId}/settings?selectedTab=workflow-integrations`);
        }
      });
    }
  });
};
