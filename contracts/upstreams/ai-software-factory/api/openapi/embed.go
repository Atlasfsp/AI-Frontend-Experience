package openapi

import (
	"embed"
	"sync"

	"github.com/getkin/kin-openapi/openapi3"
)

//go:embed openapi.yaml openapi.json
var files embed.FS

var (
	once    sync.Once
	cached  *openapi3.T
	loadErr error
)

func YAML() ([]byte, error) {
	return files.ReadFile("openapi.yaml")
}

func JSON() ([]byte, error) {
	return files.ReadFile("openapi.json")
}

func Load() (*openapi3.T, error) {
	once.Do(func() {
		loader := openapi3.NewLoader()
		loader.IsExternalRefsAllowed = false
		raw, err := YAML()
		if err != nil {
			loadErr = err
			return
		}
		cached, loadErr = loader.LoadFromData(raw)
		if loadErr != nil {
			return
		}
		loadErr = cached.Validate(loader.Context)
	})

	return cached, loadErr
}

func MustLoad() *openapi3.T {
	doc, err := Load()
	if err != nil {
		panic(err)
	}

	return doc
}
