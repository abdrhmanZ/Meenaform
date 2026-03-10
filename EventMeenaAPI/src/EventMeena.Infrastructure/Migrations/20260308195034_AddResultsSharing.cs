using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventMeena.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResultsSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsResultsShared",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ResultsSharePermissionsJson",
                table: "Events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResultsShareToken",
                table: "Events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResultsSharedEmailsJson",
                table: "Events",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsResultsShared",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ResultsSharePermissionsJson",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ResultsShareToken",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ResultsSharedEmailsJson",
                table: "Events");
        }
    }
}
