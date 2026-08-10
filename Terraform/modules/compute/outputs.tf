output "instance_type" {
  value = var.instance_type
}

output "public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.medimate_instance.public_ip
}