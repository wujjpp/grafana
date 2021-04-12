package provisioning

import "context"

type Calls struct {
	RunInitProvisioners                 []interface{}
	RunProvisioner                      []interface{}
	Run                                 []interface{}
	GetDashboardProvisionerResolvedPath []interface{}
	GetAllowUIUpdatesFromConfig         []interface{}
}

type ProvisioningServiceMock struct {
	Calls                                   *Calls
	RunInitProvisionersFunc                 func() error
	RunProvisionerFunc                      func(provisionerUID string) error
	GetDashboardProvisionerResolvedPathFunc func(name string) string
	GetAllowUIUpdatesFromConfigFunc         func(name string) bool
	RunFunc                                 func(ctx context.Context) error
}

func NewProvisioningServiceMock() *ProvisioningServiceMock {
	return &ProvisioningServiceMock{
		Calls: &Calls{},
	}
}

func (mock *ProvisioningServiceMock) RunInitProvisioners() error {
	mock.Calls.RunInitProvisioners = append(mock.Calls.RunInitProvisioners, nil)
	if mock.RunInitProvisionersFunc != nil {
		return mock.RunInitProvisioners()
	}
	return nil
}

func (mock *ProvisioningServiceMock) RunProvisioner(provisionerUID string) error {
	mock.Calls.RunProvisioner = append(mock.Calls.RunProvisioner, provisionerUID)
	if mock.RunProvisionerFunc != nil {
		return mock.RunProvisioner(provisionerUID)
	}
	return nil
}

func (mock *ProvisioningServiceMock) GetDashboardProvisionerResolvedPath(name string) string {
	mock.Calls.GetDashboardProvisionerResolvedPath = append(mock.Calls.GetDashboardProvisionerResolvedPath, name)
	if mock.GetDashboardProvisionerResolvedPathFunc != nil {
		return mock.GetDashboardProvisionerResolvedPathFunc(name)
	}
	return ""
}

func (mock *ProvisioningServiceMock) GetAllowUIUpdatesFromConfig(name string) bool {
	mock.Calls.GetAllowUIUpdatesFromConfig = append(mock.Calls.GetAllowUIUpdatesFromConfig, name)
	if mock.GetAllowUIUpdatesFromConfigFunc != nil {
		return mock.GetAllowUIUpdatesFromConfigFunc(name)
	}
	return false
}

func (mock *ProvisioningServiceMock) Run(ctx context.Context) error {
	mock.Calls.Run = append(mock.Calls.Run, ctx)
	if mock.RunFunc != nil {
		return mock.Run(ctx)
	}
	return nil
}
