package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var name string

var helloCmd = &cobra.Command{
	Use:   "hello",
	Short: "Print a greeting (sample subcommand)",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Printf("hello, %s\n", name)
		return nil
	},
}

func init() {
	helloCmd.Flags().StringVarP(&name, "name", "n", "world", "name to greet")
	rootCmd.AddCommand(helloCmd)
}
