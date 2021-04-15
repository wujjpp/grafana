package provisioning

import (
	"errors"

	"github.com/grafana/grafana/pkg/registry"
)

const (
	DatasourcesProvisionerUID   = "DatasourcesProvisioner"
	PluginsProvisionerUID       = "PluginsProvisioner"
	DashboardsProvisionerUID    = "DashboardsProvisioner"
	NotificationsProvisionerUID = "NotificationsProvisioner"
)

var (
	ErrUnknownProvisioner = errors.New("unknown provisioner provided")
)

type ProvisioningService interface {
	RunInitProvisioners() error
	RunProvisioner(provisionerUID string) error
	GetProvisionerResolvedPath(provisionerUID, name string) (string, error)
	GetAllowUIUpdatesFromConfig(provisionerUID, name string) (bool, error)
	registry.BackgroundService
}
