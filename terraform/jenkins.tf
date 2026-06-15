resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.jenkins_instance_type
  key_name               = var.key_name
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

  root_block_device {
    volume_size           = var.jenkins_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }



  tags = {
    Name = "newsera-jenkins-host"
  }
}
