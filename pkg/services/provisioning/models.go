package provisioning

import "errors"

const (
	DatasourcesProvisionerUID   = "DatasourcesProvisioner"
	PluginsProvisionerUID       = "PluginsProvisioner"
	DashboardsProvisionerUID    = "DashboardsProvisioner"
	NotificationsProvisionerUID = "NotificationsProvisioner"
)

var (
	ErrUnknownProvisioner = errors.New("unknown provisioner provided")
)
