resource "aws_key_pair" "medimate_auth" {
  key_name   = "medimate_key"
  public_key = file(var.public_key_path)
}

resource "aws_instance" "medimate_instance" {
  instance_type               = var.instance_type
  ami                         = var.ami_id
  key_name                    = aws_key_pair.medimate_auth.key_name
  vpc_security_group_ids      = [var.security_group_id]
  subnet_id                   = var.subnet_id

  # FIX: Explicitly reference user_data.tpl from the root Terraform directory
  user_data                   = file("${path.root}/user_data.tpl")
  user_data_replace_on_change = true

  tags = {
    Name = "Medimate_instnace"
  }

  root_block_device {
    volume_size = var.volume_size
  }

  provisioner "local-exec" {
    command = templatefile("${path.root}/${var.host_os}-ssh-config.tpl", {
      hostname     = self.public_ip
      user         = "ubuntu"
      identityfile = var.private_key_path
    })
  }
}