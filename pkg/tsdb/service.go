package tsdb

import (
	"context"
	"fmt"

	"github.com/grafana/grafana/pkg/infra/httpclient"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/backendplugin"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/services/oauthtoken"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor"
	"github.com/grafana/grafana/pkg/tsdb/cloudmonitoring"
	"github.com/grafana/grafana/pkg/tsdb/mssql"
	"github.com/grafana/grafana/pkg/tsdb/mysql"
	"github.com/grafana/grafana/pkg/tsdb/postgres"
)

// NewService returns a new Service.
func NewService() Service {
	return Service{
		//nolint: staticcheck // plugins.DataPlugin deprecated
		registry: map[string]func(*models.DataSource) (plugins.DataPlugin, error){},
	}
}

func init() {
	svc := NewService()
	registry.Register(&registry.Descriptor{
		Name:     "DataService",
		Instance: &svc,
	})
}

// Service handles data requests to data sources.
type Service struct {
	Cfg                    *setting.Cfg              `inject:""`
	PostgresService        *postgres.PostgresService `inject:""`
	CloudMonitoringService *cloudmonitoring.Service  `inject:""`
	AzureMonitorService    *azuremonitor.Service     `inject:""`
	PluginManager          plugins.Manager           `inject:""`
	BackendPluginManager   backendplugin.Manager     `inject:""`
	HTTPClientProvider     httpclient.Provider       `inject:""`
	OAuthTokenService      *oauthtoken.Service       `inject:""`

	//nolint: staticcheck // plugins.DataPlugin deprecated
	registry map[string]func(*models.DataSource) (plugins.DataPlugin, error)
}

// Init initialises the service.
func (s *Service) Init() error {
	s.registry["mssql"] = mssql.NewExecutor
	s.registry["postgres"] = s.PostgresService.NewExecutor
	s.registry["mysql"] = mysql.New(s.HTTPClientProvider)
	s.registry["stackdriver"] = s.CloudMonitoringService.NewExecutor
	return nil
}

//nolint: staticcheck // plugins.DataPlugin deprecated
func (s *Service) HandleRequest(ctx context.Context, ds *models.DataSource, query plugins.DataQuery) (plugins.DataResponse, error) {
	if factory, exists := s.registry[ds.Type]; exists {
		var err error
		plugin, err := factory(ds)
		if err != nil {
			return plugins.DataResponse{}, fmt.Errorf("could not instantiate endpoint for data plugin %q: %w",
				ds.Type, err)
		}

		return plugin.DataQuery(ctx, ds, query)
	}

	return dataPluginQueryAdapter(ds.Type, s.BackendPluginManager, s.OAuthTokenService).DataQuery(ctx, ds, query)
}

// RegisterQueryHandler registers a query handler factory.
// This is only exposed for tests!
//nolint: staticcheck // plugins.DataPlugin deprecated
func (s *Service) RegisterQueryHandler(name string, factory func(*models.DataSource) (plugins.DataPlugin, error)) {
	s.registry[name] = factory
}
