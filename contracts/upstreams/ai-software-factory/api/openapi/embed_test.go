package openapi_test

import (
	"testing"

	embedded "github.com/stratogroup/neuroforge-sdx/api/openapi"
	"github.com/stretchr/testify/require"
)

func TestEmbeddedSpecIsAvailableAndValid(t *testing.T) {
	yamlBody, err := embedded.YAML()
	require.NoError(t, err)
	require.Contains(t, string(yamlBody), "openapi: 3.1.0")

	jsonBody, err := embedded.JSON()
	require.NoError(t, err)
	require.Contains(t, string(jsonBody), `"openapi": "3.1.0"`)

	document, err := embedded.Load()
	require.NoError(t, err)
	require.Equal(t, "3.1.0", document.OpenAPI)

	require.NotPanics(t, func() {
		require.NotNil(t, embedded.MustLoad())
	})
}
